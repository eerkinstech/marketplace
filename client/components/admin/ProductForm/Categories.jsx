import { useMemo, useState } from "react";

export default function ProductCategories({
  formData,
  setFormData,
  categories,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const selectCategory = (categoryId) => {
    setFormData({
      ...formData,
      categories: categoryId ? [categoryId] : [],
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
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i className="fas fa-folder text-blue-600"></i> Product Categories
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Categories are created by admins. Vendors can assign the product to one approved category. For More Category Management, Please Contact Admin.
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
          {filteredCategories.map((category) => (
            <label
              key={category._id}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 cursor-pointer"
            >
              <input
                type="radio"
                name="product-category"
                checked={formData.categories?.[0] === category._id}
                onChange={() => selectCategory(category._id)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {category.name}
                </h4>

              </div>

            </label>
          ))}
        </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">
              No categories match "{searchQuery}".
            </p>
          </div>
        )
      ) : (
        <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
          <i className="fas fa-folder text-4xl text-gray-300 mb-3"></i>
          <p className="text-sm text-gray-600">
            No categories available. Admin must create categories first.
          </p>
        </div>
      )}

      {formData.categories && formData.categories.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Assigned Category</h4>
          <div className="flex items-center justify-between gap-3">
            <div className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
              {categories.find((category) => category._id === formData.categories[0])?.name || "Unknown"}
            </div>
            <button
              type="button"
              onClick={() => selectCategory("")}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
