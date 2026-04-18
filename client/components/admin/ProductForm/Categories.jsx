import { useMemo, useState } from "react";

export default function ProductCategories({
  formData,
  setFormData,
  categories,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategoryIds = (formData.categories || []).map(String);

  const toggleCategory = (categoryId) => {
    const normalizedId = String(categoryId || "");
    const nextCategories = selectedCategoryIds.includes(normalizedId)
      ? selectedCategoryIds.filter((id) => id !== normalizedId)
      : [...selectedCategoryIds, normalizedId];

    setFormData({
      ...formData,
      categories: nextCategories
    });
  };

  const clearCategories = () => {
    setFormData({
      ...formData,
      categories: []
    });
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories || [];

    return (categories || []).filter((category) =>
      [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-900">
          <i className="fas fa-folder text-blue-600"></i> Product Categories
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Assign one or more categories to this product. The first selected category is used as the primary category for product pages and category routes.
        </p>
      </div>

      <div>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
          placeholder="Search categories..."
        />
      </div>

      {categories && categories.length > 0 ? (
        filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredCategories.map((category) => {
              const checked = selectedCategoryIds.includes(String(category._id));
              return (
                <label
                  key={category._id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition duration-200 ${
                    checked
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(category._id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {category.name}
                    </h4>
                    {category.slug ? (
                      <div className="mt-1 text-xs text-gray-500">
                        /{category.slug}
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">
              No categories match "{searchQuery}".
            </p>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <i className="fas fa-folder mb-3 text-4xl text-gray-300"></i>
          <p className="text-sm text-gray-600">
            No categories available. Admin must create categories first.
          </p>
        </div>
      )}

      {selectedCategoryIds.length > 0 ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 text-sm font-semibold text-gray-900">Assigned Categories</div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryIds.map((categoryId, index) => {
              const category = categories.find((entry) => String(entry._id) === String(categoryId));
              return (
                <div
                  key={`${categoryId}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900"
                >
                  <span>{category?.name || "Unknown"}</span>
                  {index === 0 ? <span className="text-[11px] uppercase tracking-[0.16em] text-blue-700">Primary</span> : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={clearCategories}
              className="ml-auto text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
