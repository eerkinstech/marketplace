export default function ProductSEO({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="fas fa-search text-blue-600"></i> SEO Settings
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Optimize your product for search engines
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Meta Title
        </label>
        <input
          type="text"
          value={formData.metaTitle}
          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
          maxLength="60"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          placeholder="Product Title | Your Store"
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Recommended: 30-60 characters for optimal display in search results</span>
          <span className="font-semibold">{formData.metaTitle.length}/60</span>
        </div>
        {formData.metaTitle ? (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-semibold text-gray-600">Preview in Google:</p>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-600">{formData.metaTitle}</p>
              <p className="text-xs text-gray-500">yourstore.com &gt; product &gt; {formData.slug || "product-slug"}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Meta Description
        </label>
        <textarea
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          maxLength="160"
          rows="3"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          placeholder="Write a compelling description that appears in search results..."
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Recommended: 120-160 characters for full display in search results</span>
          <span className="font-semibold">{formData.metaDescription.length}/160</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Meta Keywords
        </label>
        <input
          type="text"
          value={formData.metaKeywords}
          onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          placeholder="keyword1, keyword2, keyword3"
        />
        <p className="mt-2 text-xs text-gray-500">Separate keywords with commas. Focus on 3-5 relevant keywords.</p>
        {formData.metaKeywords ? (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-xs font-semibold text-gray-600">Keywords parsed:</p>
            <div className="flex flex-wrap gap-2">
              {formData.metaKeywords
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean)
                .map((keyword, idx) => (
                  <span key={idx} className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {keyword}
                  </span>
                ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <i className="fas fa-lightbulb text-yellow-500"></i> SEO Tips
        </h4>
        <ul className="space-y-2 text-xs text-gray-700">
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">-</span>
            <span><strong>Meta Title:</strong> Include your main keyword and brand name.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">-</span>
            <span><strong>Meta Description:</strong> Write a concise summary that earns the click.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">-</span>
            <span><strong>Keywords:</strong> Focus on relevant search phrases customers actually use.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600">-</span>
            <span><strong>URL Slug:</strong> Keep it short, descriptive, and readable.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
