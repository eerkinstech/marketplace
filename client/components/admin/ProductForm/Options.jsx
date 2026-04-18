import { useEffect, useMemo, useState } from "react";
import { getImageSource } from "@/lib/utils/images";
import MediaLibraryModal from "./MediaLibraryModal";

function ChevronIcon({ open, className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {open ? <path d="M5 7.5 10 12.5 15 7.5" /> : <path d="M7.5 5 12.5 10 7.5 15" />}
    </svg>
  );
}

function PlusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function TrashIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 5.5h13" />
      <path d="M7.5 3.5h5" />
      <path d="M6.5 5.5v10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-10" />
      <path d="M8.5 8.5v5" />
      <path d="M11.5 8.5v5" />
    </svg>
  );
}

function SearchIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M12.5 12.5 17 17" />
    </svg>
  );
}

function CloseIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6 14 14M14 6 6 14" />
    </svg>
  );
}

function normalizeOptions(options = []) {
  return options
    .map((option) => ({
      name: option.name?.trim() || "",
      values: [...new Set((option.values || []).map((value) => value.trim()).filter(Boolean))]
    }))
    .filter((option) => option.name);
}

function buildCombinations(options, index = 0, current = {}) {
  if (!options.length) return [];
  if (index === options.length) return [{ ...current }];

  const option = options[index];
  if (!option.values.length) return [];

  return option.values.flatMap((value) =>
    buildCombinations(options, index + 1, { ...current, [option.name]: value })
  );
}

function buildVariantKey(optionValues, optionOrder) {
  return optionOrder.map((optionName) => `${optionName}:${optionValues?.[optionName] || ""}`).join("|");
}

function createVariantId(variantKey) {
  return `variant-${variantKey.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "item"}`;
}

function areOptionValuesEqual(left = {}, right = {}) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  if (leftEntries.length !== rightEntries.length) return false;
  return leftEntries.every(([key, value]) => right[key] === value);
}

function areVariantsEqual(currentVariants = [], nextVariants = []) {
  if (currentVariants.length !== nextVariants.length) return false;

  return currentVariants.every((variant, index) => {
    const nextVariant = nextVariants[index];
    return (
      variant.id === nextVariant.id &&
      variant.sku === nextVariant.sku &&
      String(variant.price ?? "") === String(nextVariant.price ?? "") &&
      Number(variant.stock ?? 0) === Number(nextVariant.stock ?? 0) &&
      String(variant.weight ?? "") === String(nextVariant.weight ?? "") &&
      (variant.image || "") === (nextVariant.image || "") &&
      areOptionValuesEqual(variant.optionValues, nextVariant.optionValues)
    );
  });
}

function getVariantLabel(optionValues = {}) {
  return Object.entries(optionValues)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
}

function getCommonValue(variants, field) {
  if (!variants.length) return "";
  const firstValue = variants[0][field];
  return variants.every((variant) => String(variant[field] ?? "") === String(firstValue ?? "")) ? firstValue : "";
}

export default function ProductOptions({ formData, setFormData }) {
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [editingOptionIndex, setEditingOptionIndex] = useState(null);
  const [excludedVariantKeys, setExcludedVariantKeys] = useState([]);
  const [undoVariant, setUndoVariant] = useState(null);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [variantsExpanded, setVariantsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [mediaPicker, setMediaPicker] = useState(null);

  const productMediaItems = useMemo(
    () =>
      (formData.images || [])
        .map((image, index) => {
          const url = getImageSource(image);
          if (!url) return null;
          return {
            id: String(image?._id || image?.id || image?.publicId || `product-image-${index}`),
            url,
            alt: image?.alt || "",
            publicId: image?.publicId || ""
          };
        })
        .filter(Boolean),
    [formData.images]
  );
  const mediaImages = productMediaItems.map((item) => item.url);
  const normalizedOptions = normalizeOptions(formData.options || []);
  const optionOrder = normalizedOptions.map((option) => option.name);
  const generatedCombinations = buildCombinations(normalizedOptions);

  useEffect(() => {
    if (!groupBy && optionOrder.length) {
      setGroupBy(optionOrder[0]);
    }

    if (groupBy && !optionOrder.includes(groupBy)) {
      setGroupBy(optionOrder[0] || "");
    }
  }, [groupBy, optionOrder]);

  useEffect(() => {
    setFormData((currentFormData) => {
      const currentVariants = currentFormData.variants || [];
      const currentOptions = normalizeOptions(currentFormData.options || []);
      const currentOptionOrder = currentOptions.map((option) => option.name);
      const currentCombinations = buildCombinations(currentOptions);
      const existingVariants = new Map(
        currentVariants.map((variant) => [buildVariantKey(variant.optionValues || {}, currentOptionOrder), variant])
      );

      const nextVariants = currentCombinations
        .filter((combination) => !excludedVariantKeys.includes(buildVariantKey(combination, currentOptionOrder)))
        .map((combination) => {
          const variantKey = buildVariantKey(combination, currentOptionOrder);
          const existingVariant = existingVariants.get(variantKey);

          if (existingVariant) {
            return {
              ...existingVariant,
              optionValues: combination
            };
          }

          return {
            id: createVariantId(variantKey),
            optionValues: combination,
            sku: "",
            price: currentFormData.price || "",
            stock: 0,
            weight: "",
            image: ""
          };
        });

      if (areVariantsEqual(currentVariants, nextVariants)) return currentFormData;
      return { ...currentFormData, variants: nextVariants };
    });
  }, [excludedVariantKeys, formData.options, formData.price, setFormData]);

  useEffect(() => {
    if (!excludedVariantKeys.length) return;

    const validKeys = generatedCombinations.map((combination) => buildVariantKey(combination, optionOrder));
    setExcludedVariantKeys((currentKeys) => currentKeys.filter((key) => validKeys.includes(key)));
  }, [excludedVariantKeys.length, generatedCombinations, optionOrder]);

  const addOption = () => {
    if (!newOptionName.trim()) {
      alert("Option name is required");
      return;
    }

    setFormData({
      ...formData,
      options: [...(formData.options || []), { name: newOptionName.trim(), values: [] }]
    });
    setNewOptionName("");
  };

  const addOptionValue = (optionIndex) => {
    if (!newOptionValue.trim()) {
      alert("Option value is required");
      return;
    }

    const updatedOptions = [...(formData.options || [])];
    updatedOptions[optionIndex].values ||= [];

    if (updatedOptions[optionIndex].values.includes(newOptionValue.trim())) {
      alert("This value already exists");
      return;
    }

    updatedOptions[optionIndex].values.push(newOptionValue.trim());
    setFormData({ ...formData, options: updatedOptions });
    setNewOptionValue("");
  };

  const removeOptionValue = (optionIndex, valueIndex) => {
    const updatedOptions = [...(formData.options || [])];
    updatedOptions[optionIndex].values.splice(valueIndex, 1);
    setFormData({ ...formData, options: updatedOptions });
  };

  const removeOption = (optionIndex) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, index) => index !== optionIndex)
    });
  };

  const updateVariant = (variantId, field, value) => {
    setFormData({
      ...formData,
      variants: (formData.variants || []).map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )
    });
  };

  const updateVariantGroup = (variantIds, field, value) => {
    setFormData({
      ...formData,
      variants: (formData.variants || []).map((variant) =>
        variantIds.includes(variant.id) ? { ...variant, [field]: value } : variant
      )
    });
  };

  const openGroupMediaPicker = (group) => {
    setMediaPicker({
      mode: "group",
      title: `${group.label} Variant Media`,
      description: "Choose one product image to apply to this whole variant group.",
      variantIds: group.variants.map((variant) => variant.id),
      selectedImage: getCommonValue(group.variants, "image")
    });
  };

  const openVariantMediaPicker = (variant, fallbackImage = "") => {
    setMediaPicker({
      mode: "variant",
      title: getVariantLabel(variant.optionValues),
      description: "Choose one image from this product gallery for the selected variant.",
      variantId: variant.id,
      selectedImage: variant.image || fallbackImage || ""
    });
  };

  const applyMediaImage = (image) => {
    if (!mediaPicker) return;

    if (mediaPicker.mode === "group") {
      updateVariantGroup(mediaPicker.variantIds || [], "image", image);
    } else if (mediaPicker.mode === "variant") {
      updateVariant(mediaPicker.variantId, "image", image);
    }

    setMediaPicker(null);
  };

  const clearMediaImage = () => {
    if (!mediaPicker) return;

    if (mediaPicker.mode === "group") {
      updateVariantGroup(mediaPicker.variantIds || [], "image", "");
    } else if (mediaPicker.mode === "variant") {
      updateVariant(mediaPicker.variantId, "image", "");
    }

    setMediaPicker(null);
  };

  const removeVariant = (variant) => {
    const variantKey = buildVariantKey(variant.optionValues || {}, optionOrder);
    const shouldDelete = window.confirm(`Delete this variant?\n\n${getVariantLabel(variant.optionValues)}`);
    if (!shouldDelete) return;

    setExcludedVariantKeys((currentKeys) => (currentKeys.includes(variantKey) ? currentKeys : [...currentKeys, variantKey]));
    setUndoVariant({ key: variantKey, variant });
    setFormData({
      ...formData,
      variants: (formData.variants || []).filter((item) => item.id !== variant.id)
    });
  };

  const handleUndoDelete = () => {
    if (!undoVariant) return;

    setExcludedVariantKeys((currentKeys) => currentKeys.filter((key) => key !== undoVariant.key));
    setUndoVariant(null);
  };

  const filteredVariants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return formData.variants || [];

    return (formData.variants || []).filter((variant) => {
      const label = getVariantLabel(variant.optionValues).toLowerCase();
      return (
        label.includes(query) ||
        (variant.sku || "").toLowerCase().includes(query) ||
        String(variant.price ?? "").includes(query) ||
        String(variant.stock ?? "").includes(query) ||
        String(variant.weight ?? "").includes(query)
      );
    });
  }, [formData.variants, searchQuery]);

  const groupedVariants = useMemo(() => {
    const activeGroupBy = groupBy || optionOrder[0] || "Variant";

    return filteredVariants.reduce((groups, variant) => {
      const groupValue = variant.optionValues?.[activeGroupBy] || "Ungrouped";
      const groupKey = `${activeGroupBy}:${groupValue}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          label: groupValue,
          optionName: activeGroupBy,
          variants: []
        };
      }

      groups[groupKey].variants.push(variant);
      return groups;
    }, {});
  }, [filteredVariants, groupBy, optionOrder]);

  useEffect(() => {
    setCollapsedGroups((currentState) => {
      const nextState = { ...currentState };
      let changed = false;
      const groupKeys = Object.keys(groupedVariants);

      groupKeys.forEach((groupKey) => {
        if (typeof nextState[groupKey] === "undefined") {
          nextState[groupKey] = true;
          changed = true;
        }
      });

      Object.keys(nextState).forEach((groupKey) => {
        if (!groupKeys.includes(groupKey)) {
          delete nextState[groupKey];
          changed = true;
        }
      });

      return changed ? nextState : currentState;
    });
  }, [groupedVariants]);

  return (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-gray-300 bg-[#f8f6f2] p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setOptionsExpanded((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <ChevronIcon open={optionsExpanded} className="h-5 w-5 text-gray-950" />
            <h3 className="text-base font-bold text-gray-950">Options</h3>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newOptionName}
              onChange={(event) => setNewOptionName(event.target.value)}
              placeholder="Option name"
              className="hidden rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-[11px] outline-none lg:block"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                addOption();
              }}
                className="rounded-2xl bg-[#b87430] px-5 py-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#9f6428]"
            >
              <span className="inline-flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                <span>Add Option</span>
              </span>
            </button>
          </div>
        </button>

        {optionsExpanded ? (
          <div className="mt-6 space-y-4">
            <div className="grid gap-3 lg:hidden">
              <input
                type="text"
                value={newOptionName}
                onChange={(event) => setNewOptionName(event.target.value)}
                placeholder="Option name"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-[11px] outline-none"
              />
              <button
                type="button"
                onClick={addOption}
                className="rounded-2xl bg-[#b87430] px-5 py-3 text-[11px] font-semibold text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Option</span>
                </span>
              </button>
            </div>

            {formData.options?.length ? (
              formData.options.map((option, optionIndex) => {
                const isEditing = editingOptionIndex === optionIndex;
                return (
                  <div key={optionIndex} className="rounded-2xl border border-gray-300 bg-white p-5">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setEditingOptionIndex(isEditing ? null : optionIndex)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-gray-900"
                      >
                        <ChevronIcon open={isEditing} className="h-5 w-5" />
                      </button>

                      <div className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-4 text-sm font-medium text-gray-900">
                        {option.name}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeOption(optionIndex)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-[#fbfaf7] p-4">
                        {option.values?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {option.values.map((value, valueIndex) => (
                              <div key={valueIndex} className="flex items-center gap-2 rounded-full border border-[#dfc4a4] bg-[#f6e8d7] px-3 py-1.5 text-[11px] font-medium text-[#6c4a24]">
                                <span>{value}</span>
                                <button
                                  type="button"
                                  onClick={() => removeOptionValue(optionIndex, valueIndex)}
                                  className="rounded-full p-1 transition hover:bg-[#e9d3bb]"
                                >
                                  <CloseIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-500">
                            Add values to generate variants automatically.
                          </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <input
                            type="text"
                            value={newOptionValue}
                            onChange={(event) => setNewOptionValue(event.target.value)}
                            placeholder={`Add value for ${option.name}`}
                            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-[11px] outline-none transition focus:border-[#b87430] focus:ring-2 focus:ring-[#e7c7a0]"
                            onKeyDown={(event) => {
                              if (event.key === "Enter") addOptionValue(optionIndex);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => addOptionValue(optionIndex)}
                            className="rounded-xl bg-[#b87430] px-5 py-3 text-[11px] font-semibold text-white"
                          >
                            Add Value
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOptionIndex(null)}
                            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-[11px] font-semibold text-gray-700"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-6 text-sm text-gray-500">
                Add an option like Size or Color.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-[22px] border border-gray-300 bg-[#f8f6f2] p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setVariantsExpanded((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-4">
            <ChevronIcon open={variantsExpanded} className="h-5 w-5 text-gray-950" />
              <h3 className="text-base font-bold text-gray-950">
                Variants ({formData.variants?.length || 0})
              </h3>
          </div>
        </button>

        {variantsExpanded ? (
          <div className="mt-6 space-y-5">
            {undoVariant ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-[11px] text-amber-900">
                  <div className="font-semibold">Variant deleted locally</div>
                  <div>{getVariantLabel(undoVariant.variant.optionValues)} will only be removed after save.</div>
                </div>
                <button
                  type="button"
                  onClick={handleUndoDelete}
                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-[11px] font-semibold text-amber-900"
                >
                  Undo Delete
                </button>
              </div>
            ) : null}

            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search variants..."
                  className="w-full min-w-0 rounded-2xl border border-gray-900 bg-white py-4 pl-14 pr-4 text-xs text-gray-700 outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="text-sm font-medium text-gray-600">Group by</span>
                <select
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value)}
                  className="rounded-2xl border border-gray-900 bg-white px-4 py-3 text-xs text-gray-900 outline-none"
                >
                  {(optionOrder.length ? optionOrder : ["Variant"]).map((optionName) => (
                    <option key={optionName} value={optionName}>
                      {optionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {normalizedOptions.length > 0 && generatedCombinations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-6 text-sm text-gray-500">
                Add at least one value in every option to generate variants automatically.
              </div>
            ) : null}

            {!filteredVariants.length && formData.variants?.length ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-6 text-sm text-gray-500">
                No variants matched your search.
              </div>
            ) : null}

            {Object.values(groupedVariants).map((group) => {
              const isCollapsed = collapsedGroups[group.key];
              const groupVariantIds = group.variants.map((variant) => variant.id);
              const groupPrice = getCommonValue(group.variants, "price");
              const groupStock = getCommonValue(group.variants, "stock");
              const groupWeight = getCommonValue(group.variants, "weight");
              const groupImage = getCommonValue(group.variants, "image");

              return (
                <div key={group.key} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_4px_18px_rgba(15,23,42,0.06)]">
                  <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedGroups((currentState) => ({
                          ...currentState,
                          [group.key]: !currentState[group.key]
                        }))
                      }
                      className="flex items-center gap-5 text-left"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-900">
                        <ChevronIcon open={!isCollapsed} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold uppercase tracking-tight text-gray-950">{group.label}</div>
                        <div className="text-sm text-gray-800">{group.variants.length} variant(s)</div>
                      </div>
                    </button>

                    <div className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Price:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={groupPrice}
                          onChange={(event) => updateVariantGroup(groupVariantIds, "price", event.target.value)}
                          placeholder="Price"
                          className="min-w-0 flex-1 rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                        />
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Stock:</label>
                        <input
                          type="number"
                          min="0"
                          value={groupStock}
                          onChange={(event) => updateVariantGroup(groupVariantIds, "stock", parseInt(event.target.value, 10) || 0)}
                          placeholder="Stock"
                          className="min-w-0 flex-1 rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                        />
                      </div>

                      <div className="flex min-w-0 items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Weight:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={groupWeight}
                          onChange={(event) => updateVariantGroup(groupVariantIds, "weight", event.target.value)}
                          placeholder="Weight"
                          className="min-w-0 flex-1 rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openGroupMediaPicker(group)}
                        className="rounded-xl border border-gray-900 bg-white px-4 py-3 text-[11px] font-semibold text-gray-600 2xl:justify-self-end"
                      >
                        Assign Image
                      </button>
                    </div>
                  </div>

                  {!isCollapsed ? (
                    <div className="mt-5 space-y-4">
                      {groupImage ? (
                        <div className="flex items-center gap-3 rounded-2xl border border-[#d9c6ab] bg-[#fbf6ef] p-3">
                          <img src={groupImage} alt="Group variant" className="h-16 w-16 rounded-xl object-cover" />
                          <div className="flex-1 text-sm text-gray-700">This image is applied to the whole group.</div>
                          <button
                            type="button"
                            onClick={() => updateVariantGroup(groupVariantIds, "image", "")}
                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600"
                          >
                            Clear
                          </button>
                        </div>
                      ) : null}

                      {mediaImages.length ? null : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-[#fcfbf8] px-4 py-4 text-sm text-gray-500">
                          Upload product images first to assign group images.
                        </div>
                      )}

                      {group.variants.map((variant) => (
                        <div key={variant.id} className="max-w-[860px] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3 text-xs font-medium text-[#7c5a31]">
                                {getVariantLabel(variant.optionValues)}
                              </div>

                              <div className="grid gap-3 md:grid-cols-4">
                                <div>
                                  <label className="mb-1 block text-sm font-bold text-gray-950">SKU</label>
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(event) => updateVariant(variant.id, "sku", event.target.value)}
                                    placeholder="SKU"
                                    className="w-full rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-bold text-gray-950">Price</label>
                                  <input
                                    type="number"
                                    value={variant.price}
                                    onChange={(event) => updateVariant(variant.id, "price", event.target.value)}
                                    step="0.01"
                                    min="0"
                                    className="w-full rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-bold text-gray-950">Stock</label>
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(event) => updateVariant(variant.id, "stock", parseInt(event.target.value, 10) || 0)}
                                    min="0"
                                    className="w-full rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-bold text-gray-950">Weight</label>
                                  <input
                                    type="number"
                                    value={variant.weight || ""}
                                    onChange={(event) => updateVariant(variant.id, "weight", event.target.value)}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-gray-900 bg-white px-4 py-3 text-xs outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => openVariantMediaPicker(variant, groupImage)}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                              >
                                {variant.image || groupImage ? (
                                  <img
                                    src={variant.image || groupImage}
                                    alt="Variant"
                                    className="h-28 w-28 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-[#faf8f3] px-3 text-center text-xs text-gray-400">
                                    Assign image
                                  </div>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => removeVariant(variant)}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!formData.variants?.length && normalizedOptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-6 text-sm text-gray-500">
                Variants will appear here after you add options and values.
              </div>
            ) : null}

            {formData.variants?.length ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
                Variant weight overrides the main product weight for shipping. Leave variant weight empty or zero to fall back to the main product weight.
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <MediaLibraryModal
        open={Boolean(mediaPicker)}
        mode="single"
        title={mediaPicker?.title || "Variant media"}
        description={mediaPicker?.description || "Choose a product image for this variant."}
        items={productMediaItems}
        selectedItems={mediaPicker?.selectedImage ? [{ url: mediaPicker.selectedImage }] : []}
        allowUpload={false}
        emptyMessage="No product media found. Add images in the Images tab first, then assign them to variants here."
        onClose={() => setMediaPicker(null)}
        onSave={(selectedItemsList) => {
          const selectedImage = selectedItemsList[0]?.url || "";
          if (selectedImage) {
            applyMediaImage(selectedImage);
          } else {
            clearMediaImage();
          }
        }}
      />
    </div>
  );
}
