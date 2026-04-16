import RichTextEditor from "./RichTextEditor";

export default function ProductBasicInfo({
  formData,
  setFormData,
  onGenerateSlug,
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          placeholder="Enter product name"
        />
        <p className="text-xs text-gray-500 mt-1">
          This is the main product title shown to customers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            URL Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
            placeholder="e.g., amazing-product"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL: /products/{formData.slug || "product-slug"}
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onGenerateSlug}
            className="mt-7 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 w-full"
          >
            <i className="fas fa-magic"></i> Auto-Generate Slug
          </button>
        </div>
      </div>

      <div>
        <RichTextEditor
          label={<span>Description <span className="text-red-500">*</span></span>}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e })
          }
          placeholder="Enter detailed product description"
          rows={10}
          helperText="Use the toolbar to format product content. The saved description is stored as HTML."
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Vendor products stay pending until an admin approves them. Pending or rejected vendor products do not appear on the storefront or GMC feed.
      </div>
    </div>
  );
}
