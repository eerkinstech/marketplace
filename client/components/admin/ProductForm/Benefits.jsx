function createBenefitField() {
  return {
    id: `benefit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    heading: "",
    text: ""
  };
}

export default function ProductBenefits({ formData, setFormData }) {
  const benefitFields = Array.isArray(formData.benefitFields) ? formData.benefitFields : [];

  function updateField(id, key, value) {
    setFormData({
      ...formData,
      benefitFields: benefitFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    });
  }

  function addField() {
    setFormData({
      ...formData,
      benefitFields: [...benefitFields, createBenefitField()]
    });
  }

  function removeField(id) {
    setFormData({
      ...formData,
      benefitFields: benefitFields.filter((field) => field.id !== id)
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="fas fa-star text-yellow-500"></i> Product Benefits
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add item-specific fields one by one using a heading and text value.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Benefits Heading
        </label>
        <input
          type="text"
          value={formData.benefitsHeading}
          onChange={(e) =>
            setFormData({ ...formData, benefitsHeading: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
          placeholder="e.g., Why Choose This Product?"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-gray-900">
            Item Fields
          </label>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <i className="fas fa-plus"></i>
            Add Field
          </button>
        </div>

        {benefitFields.length ? (
          <div className="space-y-4">
            {benefitFields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Field {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                    aria-label={`Remove field ${index + 1}`}
                  >
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={field.heading}
                      onChange={(event) => updateField(field.id, "heading", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g., Material"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Text
                    </label>
                    <input
                      type="text"
                      value={field.text}
                      onChange={(event) => updateField(field.id, "text", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g., Solid oak finish"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
            No fields added yet. Click <span className="font-semibold text-gray-700">Add Field</span> to create the first item detail.
          </div>
        )}
      </div>

      {(formData.benefitsHeading || benefitFields.some((field) => field.heading || field.text)) && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Benefits Preview
          </h4>
          <div className="bg-white p-4 rounded border border-gray-200">
            {formData.benefitsHeading && (
              <h5 className="text-lg font-bold text-gray-900 mb-3">
                {formData.benefitsHeading}
              </h5>
            )}
            <div className="space-y-3">
              {benefitFields.filter((field) => field.heading || field.text).map((field) => (
                <div key={field.id} className="grid gap-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                  <div className="text-sm font-semibold text-gray-900">{field.heading || "Heading"}</div>
                  <div className="text-sm text-gray-700">{field.text || "Text"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
