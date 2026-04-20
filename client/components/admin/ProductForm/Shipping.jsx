export default function ProductShipping({
  formData,
  setFormData,
  shippingAreas = [],
  loading = false,
  error = "",
  scopeLabel = "your"
}) {
  const selectedIds = (formData.shippingAreaIds || []).map(String);

  function toggleShippingArea(areaId) {
    const normalizedId = String(areaId || "");
    const nextIds = selectedIds.includes(normalizedId)
      ? selectedIds.filter((id) => id !== normalizedId)
      : [...selectedIds, normalizedId];

    setFormData({
      ...formData,
      shippingAreaIds: nextIds
    });
  }

  function clearShippingAreas() {
    setFormData({
      ...formData,
      shippingAreaIds: []
    });
  }

  function formatRate(area) {
    const minRate = Number(area?.minRate || 0);
    const maxRate = Number(area?.maxRate || 0);

    if (!minRate && !maxRate) return "Free";
    if (minRate === maxRate) return `$${minRate.toFixed(2)}`;
    return `$${minRate.toFixed(2)} - $${maxRate.toFixed(2)}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-900">
          <i className="fas fa-truck-fast text-blue-600"></i> Product Shipping
        </h3>
        <p className="text-sm text-gray-600">
          Assign shipping options created under {scopeLabel} account. Only selected options can be used to calculate this product's shipping at checkout.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
          <i className="fas fa-spinner mr-2 animate-spin"></i>
          Loading shipping options...
        </div>
      ) : shippingAreas.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shippingAreas.map((area) => {
            const checked = selectedIds.includes(String(area._id));
            const active = area.isActive !== false;

            return (
              <label
                key={area._id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition duration-200 ${
                  checked
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleShippingArea(area._id)}
                  className="mt-1 h-4 w-4"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{area.name}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">{formatRate(area)}</span>
                    {area.estimatedDays ? (
                      <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">{area.estimatedDays}</span>
                    ) : null}
                    <span className="rounded-full bg-white px-2 py-1 ring-1 ring-gray-200">
                      {(area.rules || []).length} rule{(area.rules || []).length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <i className="fas fa-truck-fast mb-3 text-4xl text-gray-300"></i>
          <p className="text-sm font-semibold text-gray-800">No shipping options found.</p>
          <p className="mt-1 text-sm text-gray-600">Create shipping options first, then return here to assign them to products.</p>
        </div>
      )}

      {selectedIds.length > 0 ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-2 text-sm font-semibold text-gray-900">Assigned Shipping</div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.map((areaId) => {
              const area = shippingAreas.find((entry) => String(entry._id) === String(areaId));
              if (!area) return null;

              return (
                <span key={areaId} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900">
                  {area.name}
                </span>
              );
            })}
            <button
              type="button"
              onClick={clearShippingAreas}
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
