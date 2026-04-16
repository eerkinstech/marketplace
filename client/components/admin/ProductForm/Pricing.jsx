export default function ProductPricing({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="fas fa-tag text-blue-600"></i> Pricing Information
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Regular Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-600">$</span>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Selling price for customers</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Compare Price
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-gray-600">$</span>
            <input
              type="number"
              value={formData.comparePrice}
              onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
              step="0.01"
              min="0"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Original or list price (optional)</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Stock Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            min="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-500">Available units in stock</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Product SKU <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.sku || ""}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="SKU-001"
          />
          <p className="mt-1 text-xs text-gray-500">Main SKU for the product record</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Product Weight
          </label>
          <input
            type="number"
            value={formData.weight || ""}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500">Used for shipping when no variant-specific weight is set</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Shipping weight rule: if a variant has its own weight, that variant weight is used. The main product weight only applies when variants do not define weight.
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Price Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Selling Price:</span>
            <span className="font-semibold text-gray-900">${parseFloat(formData.price || 0).toFixed(2)}</span>
          </div>
          {formData.comparePrice ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Compare Price:</span>
                <span className="font-semibold text-gray-900">${parseFloat(formData.comparePrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">You Save:</span>
                <span className="font-semibold text-green-600">
                  ${(parseFloat(formData.comparePrice) - parseFloat(formData.price || 0)).toFixed(2)} (
                  {Math.round(
                    ((parseFloat(formData.comparePrice) - parseFloat(formData.price || 0)) /
                      parseFloat(formData.comparePrice)) *
                      100
                  )}
                  %)
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {parseInt(formData.stock || 0, 10) < 10 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Low stock warning: Only {formData.stock || 0} units available
          </p>
        </div>
      ) : null}
    </div>
  );
}
