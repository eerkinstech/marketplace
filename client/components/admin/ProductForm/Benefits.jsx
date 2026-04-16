import RichTextEditor from "./RichTextEditor";

export default function ProductBenefits({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="fas fa-star text-yellow-500"></i> Product Benefits
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Highlight the key benefits and features of your product
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

      <div>
        <RichTextEditor
          label="Benefits Description"
          value={formData.benefitsText}
          onChange={(e) =>
            setFormData({ ...formData, benefitsText: e })
          }
          placeholder="Describe the benefits in HTML format or plain text&#10;- Feature 1&#10;- Feature 2&#10;- Feature 3"
          rows={10}
          helperText="Use the editor to build benefit paragraphs, lists, headings, and links."
        />
      </div>

      {/* Preview */}
      {(formData.benefitsHeading || formData.benefitsText) && (
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
            <div
              className="text-sm text-gray-700 space-y-2"
              dangerouslySetInnerHTML={{ __html: formData.benefitsText }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
