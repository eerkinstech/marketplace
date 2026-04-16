"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { marketplaceApi } from "@/lib/api/marketplace";
import { useAccessToken } from "@/lib/auth/use-access-token";

const TAB_CONFIG = [
  { key: "browse", title: "Shop Category", icon: "fa-sitemap" },
  { key: "topBar", title: "Top Bar", icon: "fa-stream" },
  { key: "mainNav", title: "Main Nav", icon: "fa-bars" },
  { key: "footer", title: "Footer", icon: "fa-link" },
  { key: "policies", title: "Policies", icon: "fa-file-lines" }
];

const MENU_FIELDS = {
  browse: "browseMenu",
  topBar: "topBarMenu",
  mainNav: "mainNavMenu",
  footer: "footerMenu",
  policies: "policiesMenu"
};

const EMPTY_MENUS = {
  browseMenu: [],
  topBarMenu: [],
  mainNavMenu: [],
  footerMenu: [],
  policiesMenu: []
};

function createItem(type = "custom", label = "New Item", url = "#") {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    url,
    link: url,
    type,
    submenu: []
  };
}

function normalizeMenus(payload) {
  return {
    browseMenu: Array.isArray(payload?.browseMenu) ? payload.browseMenu : [],
    topBarMenu: Array.isArray(payload?.topBarMenu) ? payload.topBarMenu : [],
    mainNavMenu: Array.isArray(payload?.mainNavMenu) ? payload.mainNavMenu : [],
    footerMenu: Array.isArray(payload?.footerMenu) ? payload.footerMenu : [],
    policiesMenu: Array.isArray(payload?.policiesMenu) ? payload.policiesMenu : []
  };
}

function updateRecursive(items, itemId, updater) {
  return items.map((item) => {
    if (item.id === itemId) {
      return updater(item);
    }

    if (Array.isArray(item.submenu) && item.submenu.length) {
      return { ...item, submenu: updateRecursive(item.submenu, itemId, updater) };
    }

    return item;
  });
}

function removeRecursive(items, itemId) {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) => ({
      ...item,
      submenu: Array.isArray(item.submenu) ? removeRecursive(item.submenu, itemId) : []
    }));
}

function moveRecursive(items, itemId, direction) {
  const index = items.findIndex((item) => item.id === itemId);

  if (index !== -1) {
    const nextItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= nextItems.length) {
      return items;
    }

    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
    return nextItems;
  }

  return items.map((item) => ({
    ...item,
    submenu: Array.isArray(item.submenu) ? moveRecursive(item.submenu, itemId, direction) : []
  }));
}

function demoteRecursive(items, itemId) {
  const index = items.findIndex((item) => item.id === itemId);

  if (index > 0) {
    const nextItems = [...items];
    const item = nextItems[index];
    const previous = nextItems[index - 1];
    const nextPrevious = {
      ...previous,
      submenu: [...(Array.isArray(previous.submenu) ? previous.submenu : []), item]
    };

    nextItems[index - 1] = nextPrevious;
    nextItems.splice(index, 1);
    return { items: nextItems, changed: true };
  }

  for (let indexPointer = 0; indexPointer < items.length; indexPointer += 1) {
    const current = items[indexPointer];
    if (Array.isArray(current.submenu) && current.submenu.length) {
      const result = demoteRecursive(current.submenu, itemId);
      if (result.changed) {
        const nextItems = [...items];
        nextItems[indexPointer] = { ...current, submenu: result.items };
        return { items: nextItems, changed: true };
      }
    }
  }

  return { items, changed: false };
}

function promoteRecursive(items, itemId, parentItems = null, parentIndex = -1) {
  for (let index = 0; index < items.length; index += 1) {
    const current = items[index];

    if (current.id === itemId && parentItems && parentIndex !== -1) {
      const nextParentItems = [...parentItems];
      const nextItems = [...items];
      const [movedItem] = nextItems.splice(index, 1);
      nextParentItems.splice(parentIndex + 1, 0, movedItem);
      return { items: nextItems, changed: true, parentItems: nextParentItems };
    }

    if (Array.isArray(current.submenu) && current.submenu.length) {
      const result = promoteRecursive(current.submenu, itemId, items, index);
      if (result.changed) {
        if (result.parentItems) {
          return {
            items: result.parentItems.map((item, itemIndex) => (
              itemIndex === index ? { ...item, submenu: result.items } : item
            )),
            changed: true
          };
        }

        const nextItems = [...items];
        nextItems[index] = { ...current, submenu: result.items };
        return { items: nextItems, changed: true };
      }
    }
  }

  return { items, changed: false };
}

function reorderRecursive(items, draggedId, targetId) {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const nextItems = [...items];
    [nextItems[draggedIndex], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[draggedIndex]];
    return { items: nextItems, found: true };
  }

  for (let index = 0; index < items.length; index += 1) {
    const current = items[index];
    if (Array.isArray(current.submenu) && current.submenu.length) {
      const result = reorderRecursive(current.submenu, draggedId, targetId);
      if (result.found) {
        const nextItems = [...items];
        nextItems[index] = { ...current, submenu: result.items };
        return { items: nextItems, found: true };
      }
    }
  }

  return { items, found: false };
}

function serializeItems(items) {
  return (items || [])
    .map((item) => ({
      id: item.id || createItem().id,
      label: String(item.label || "").trim(),
      url: String(item.url || "").trim(),
      link: String(item.link || item.url || "").trim(),
      type: String(item.type || "custom").trim() || "custom",
      submenu: serializeItems(item.submenu || [])
    }))
    .filter((item) => item.label && item.url);
}

function generateMenuItemUrl(item, type) {
  if (!item?.slug) return "#";
  if (type === "category") return `/category/${item.slug}`;
  if (type === "product") return `/product/${item.slug}`;
  if (type === "policy") return `/policies/${item.slug}`;
  return `/pages/${item.slug}`;
}

export default function AdminMenusPage() {
  const { token, error: authError, setError: setAuthError } = useAccessToken(
    "Login with an admin account to manage storefront menus."
  );

  const [activeTab, setActiveTab] = useState("browse");
  const [menus, setMenus] = useState(EMPTY_MENUS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorType, setSelectorType] = useState("category");
  const [selectorLoading, setSelectorLoading] = useState(false);
  const [selectorItems, setSelectorItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const currentField = MENU_FIELDS[activeTab];
  const currentItems = menus[currentField] || [];

  const stats = useMemo(() => ({
    browse: menus.browseMenu.length,
    topBar: menus.topBarMenu.length,
    mainNav: menus.mainNavMenu.length,
    footer: menus.footerMenu.length,
    policies: menus.policiesMenu.length
  }), [menus]);

  async function loadMenuSettings() {
    if (!token) return;

    try {
      setLoading(true);
      const response = await marketplaceApi.getAdminMenuSettings(token);
      setMenus(normalizeMenus(response?.data));
      setPageError("");
    } catch (error) {
      const message = error?.message || "Failed to load menu settings";
      setPageError(message);
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenuSettings();
  }, [token]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [selectorType]);

  function setMenuItems(tabKey, nextItems) {
    const field = MENU_FIELDS[tabKey];
    setMenus((current) => ({ ...current, [field]: nextItems }));
  }

  function addCustomItem(tabKey) {
    setMenuItems(tabKey, [...(menus[MENU_FIELDS[tabKey]] || []), createItem()]);
    toast.success("Item added");
  }

  function updateItem(tabKey, itemId, updates) {
    setMenuItems(tabKey, updateRecursive(menus[MENU_FIELDS[tabKey]] || [], itemId, (item) => ({
      ...item,
      ...updates
    })));
  }

  function deleteItem(tabKey, itemId) {
    setMenuItems(tabKey, removeRecursive(menus[MENU_FIELDS[tabKey]] || [], itemId));
    toast.success("Item deleted");
  }

  function moveItem(tabKey, itemId, direction) {
    setMenuItems(tabKey, moveRecursive(menus[MENU_FIELDS[tabKey]] || [], itemId, direction));
  }

  function demoteItem(tabKey, itemId) {
    const result = demoteRecursive(menus[MENU_FIELDS[tabKey]] || [], itemId);
    if (result.changed) {
      setMenuItems(tabKey, result.items);
      toast.success("Item indented");
    }
  }

  function promoteItem(tabKey, itemId) {
    const result = promoteRecursive(menus[MENU_FIELDS[tabKey]] || [], itemId);
    if (result.changed) {
      setMenuItems(tabKey, result.items);
      toast.success("Item outdented");
    }
  }

  function toggleExpanded(itemId) {
    setExpandedItems((current) => ({ ...current, [itemId]: !current[itemId] }));
  }

  async function loadSelectorData(type) {
    try {
      setSelectorLoading(true);
      let response;

      if (type === "category") {
        response = await marketplaceApi.getAdminCategories(token);
      } else if (type === "product") {
        response = await marketplaceApi.getAdminProducts(token);
      } else {
        response = await marketplaceApi.getAdminPages(token);
      }

      let data = Array.isArray(response?.data) ? response.data : [];
      if (type === "page" || type === "policy") {
        data = data.filter((item) => item.type === type);
      }
      setSelectorItems(data);
    } catch (error) {
      toast.error(error?.message || `Failed to load ${type}s`);
      setSelectorItems([]);
    } finally {
      setSelectorLoading(false);
    }
  }

  async function openSelector(type) {
    setSelectorType(type);
    setShowSelectorModal(true);
    await loadSelectorData(type);
  }

  function addSelectedItems() {
    if (!selectedItems.size) {
      toast.error("Select at least one item");
      return;
    }

    const nextItems = selectorItems
      .filter((item) => selectedItems.has(item._id))
      .map((item) => ({
        id: `${selectorType}_${item._id}`,
        label: item.name || item.title || "Untitled",
        url: generateMenuItemUrl(item, selectorType),
        link: generateMenuItemUrl(item, selectorType),
        type: selectorType,
        submenu: []
      }));

    setMenuItems(activeTab, [...currentItems, ...nextItems]);
    setShowSelectorModal(false);
    setSelectedItems(new Set());
    toast.success(`Added ${nextItems.length} item${nextItems.length === 1 ? "" : "s"}`);
  }

  async function saveAllMenus() {
    try {
      setSaving(true);
      await marketplaceApi.updateAdminMenuSettings(token, {
        browseMenu: serializeItems(menus.browseMenu),
        topBarMenu: serializeItems(menus.topBarMenu),
        mainNavMenu: serializeItems(menus.mainNavMenu),
        footerMenu: serializeItems(menus.footerMenu),
        policiesMenu: serializeItems(menus.policiesMenu)
      });
      toast.success("Menus saved");
      await loadMenuSettings();
    } catch (error) {
      const message = error?.message || "Failed to save menus";
      setPageError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function handleDragStart(event, itemId) {
    setDraggedItem(itemId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDropReorder(event, itemId) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedItem || draggedItem === itemId) {
      setDraggedItem(null);
      return;
    }

    const result = reorderRecursive(currentItems, draggedItem, itemId);
    if (result.found) {
      setMenuItems(activeTab, result.items);
    }

    setDraggedItem(null);
  }

  function startEditing(menuKey, item) {
    setEditingItem({ menuKey, itemId: item.id });
    setEditLabel(item.label || "");
    setEditUrl(item.url || "");
  }

  function renderBrowseMenu(items, level = 0) {
    if (!items.length) {
      return <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-slate-500">No browse items yet.</div>;
    }

    return (
      <div className={`space-y-3 ${level > 0 ? "ml-5 border-l border-[#d8c5b1] pl-4" : ""}`}>
        {items.map((item, index) => (
          <div key={item.id} className="space-y-3">
            <div
              draggable
              onDragStart={(event) => handleDragStart(event, item.id)}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => handleDropReorder(event, item.id)}
              className={`rounded-[22px] border p-4 transition ${draggedItem === item.id ? "border-[#b56d2d] bg-[#fff4e8] opacity-60" : "border-black/8 bg-white"}`}
            >
              <div className="flex items-start gap-3">
                <div className="pt-1 text-slate-400">
                  <i className="fa-solid fa-grip-vertical" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-1 truncate text-xs text-slate-500">{item.url}</div>
                </div>

                <span className="rounded-full bg-[#f5eee4] px-2.5 py-1 text-[11px] font-semibold text-[#8a5725]">
                  {item.type || "custom"}
                </span>

                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" onClick={() => moveItem("browse", item.id, "up")} disabled={index === 0} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                    <i className="fa-solid fa-arrow-up" />
                  </button>
                  <button type="button" onClick={() => moveItem("browse", item.id, "down")} disabled={index === items.length - 1} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                    <i className="fa-solid fa-arrow-down" />
                  </button>
                  <button type="button" onClick={() => demoteItem("browse", item.id)} disabled={index === 0} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                    <i className="fa-solid fa-indent" />
                  </button>
                  <button type="button" onClick={() => promoteItem("browse", item.id)} disabled={level === 0} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                    <i className="fa-solid fa-outdent" />
                  </button>
                  <button type="button" onClick={() => startEditing("browse", item)} className="h-9 w-9 rounded-xl border border-black/8 text-sky-600 transition hover:bg-sky-50">
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button type="button" onClick={() => deleteItem("browse", item.id)} className="h-9 w-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100">
                    <i className="fa-solid fa-trash" />
                  </button>
                  {item.submenu?.length ? (
                    <button type="button" onClick={() => toggleExpanded(item.id)} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50">
                      <i className={`fa-solid ${expandedItems[item.id] ? "fa-chevron-up" : "fa-chevron-down"}`} />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {item.submenu?.length && expandedItems[item.id] !== false ? renderBrowseMenu(item.submenu, level + 1) : null}
          </div>
        ))}
      </div>
    );
  }

  function renderSimpleMenu(items, menuKey) {
    if (!items.length) {
      return <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-slate-500">No items in this section yet.</div>;
    }

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-[22px] border border-black/8 bg-white p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{item.url}</div>
              </div>

              <span className="rounded-full bg-[#f5eee4] px-2.5 py-1 text-[11px] font-semibold text-[#8a5725]">
                {item.type || "custom"}
              </span>

              <div className="flex flex-wrap items-center gap-1">
                <button type="button" onClick={() => moveItem(menuKey, item.id, "up")} disabled={index === 0} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                  <i className="fa-solid fa-arrow-up" />
                </button>
                <button type="button" onClick={() => moveItem(menuKey, item.id, "down")} disabled={index === items.length - 1} className="h-9 w-9 rounded-xl border border-black/8 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30">
                  <i className="fa-solid fa-arrow-down" />
                </button>
                <button type="button" onClick={() => startEditing(menuKey, item)} className="h-9 w-9 rounded-xl border border-black/8 text-sky-600 transition hover:bg-sky-50">
                  <i className="fa-solid fa-pen" />
                </button>
                <button type="button" onClick={() => deleteItem(menuKey, item.id)} className="h-9 w-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="container page-section stack">
      <div className="rounded-[28px] border border-[#d9c9b7] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ef_100%)] p-6 shadow-[0_24px_60px_rgba(120,53,15,0.08)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#1f2937]">Storefront Menus</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Manage the global menu settings document used by the storefront header, footer, browse dropdown, and policy links.
            </p>
          </div>

          <button
            type="button"
            onClick={saveAllMenus}
            disabled={saving || !token}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f3136] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#202226] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-floppy-disk" />
            {saving ? "Saving..." : "Save Menus"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {TAB_CONFIG.map((tab) => (
          <div key={tab.key} className="stat-chip">
            <div className="mini-label">{tab.title}</div>
            <div className="mt-3 text-3xl font-semibold text-ink">{stats[tab.key]}</div>
            <div className="mt-2 text-sm text-slate-600">Saved links</div>
          </div>
        ))}
      </div>

      {authError ? <div className="card section small">{authError}</div> : null}
      {pageError ? <div className="card section small">{pageError}</div> : null}

      <div className="rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.06)] md:p-6">
        <div className="flex flex-wrap gap-2">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.key
                ? "bg-[#b56d2d] text-white shadow-[0_12px_24px_rgba(181,109,45,0.25)]"
                : "border border-black/8 bg-[#f8f4ee] text-slate-700 hover:bg-[#f3ece2]"
                }`}
            >
              <i className={`fa-solid ${tab.icon}`} />
              {tab.title}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mini-label">Editing</div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              {TAB_CONFIG.find((tab) => tab.key === activeTab)?.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {activeTab === "browse"
                ? "Browse supports nesting, indent/outdent, and drag reordering."
                : "Use direct links for this menu block. Page and policy items now follow their saved content type."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addCustomItem(activeTab)} className="inline-flex items-center gap-2 rounded-xl bg-[#b56d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9c5c24]">
              <i className="fa-solid fa-plus" />
              Add Item
            </button>
            <button type="button" onClick={() => openSelector("category")} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700">Category</button>
            <button type="button" onClick={() => openSelector("product")} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">Product</button>
            <button type="button" onClick={() => openSelector("page")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Page</button>
            <button type="button" onClick={() => openSelector("policy")} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700">Policy</button>
          </div>
        </div>

        <div className="mt-6">
          {loading
            ? <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-slate-500">Loading menus...</div>
            : activeTab === "browse"
              ? renderBrowseMenu(currentItems)
              : renderSimpleMenu(currentItems, activeTab)}
        </div>
      </div>

      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Edit Item</h3>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 transition hover:text-slate-700">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">Label</span>
                <input value={editLabel} onChange={(event) => setEditLabel(event.target.value)} className="rounded-2xl border border-black/10 bg-[#fbfaf8] px-4 py-3 text-sm outline-none transition focus:border-[#b56d2d]" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">URL</span>
                <input value={editUrl} onChange={(event) => setEditUrl(event.target.value)} className="rounded-2xl border border-black/10 bg-[#fbfaf8] px-4 py-3 text-sm outline-none transition focus:border-[#b56d2d]" />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-black/8 px-5 py-4">
              <button type="button" onClick={() => setEditingItem(null)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  updateItem(editingItem.menuKey, editingItem.itemId, { label: editLabel, url: editUrl, link: editUrl });
                  setEditingItem(null);
                  toast.success("Item updated");
                }}
                className="rounded-xl bg-[#b56d2d] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSelectorModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Select {selectorType}s</h3>
                {selectorType === "policy" ? (
                  <p className="mt-1 text-sm text-slate-500">Only entries saved as `policy` are listed here and link under `/policies/[slug]`.</p>
                ) : null}
              </div>
              <button type="button" onClick={() => setShowSelectorModal(false)} className="text-slate-400 transition hover:text-slate-700">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="min-h-[240px] flex-1 overflow-y-auto px-5 py-5">
              {selectorLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                  <i className="fa-solid fa-spinner animate-spin text-2xl" />
                </div>
              ) : (
                <div className="space-y-2">
                  {selectorItems.length ? selectorItems.map((item) => (
                    <label key={item._id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/8 px-4 py-3 transition hover:bg-[#f8f4ee]">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item._id)}
                        onChange={(event) => {
                          const nextSet = new Set(selectedItems);
                          if (event.target.checked) nextSet.add(item._id);
                          else nextSet.delete(item._id);
                          setSelectedItems(nextSet);
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium text-slate-800">{item.name || item.title}</span>
                    </label>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-10 text-center text-sm text-slate-500">
                      No {selectorType}s found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-black/8 px-5 py-4">
              <button type="button" onClick={() => setShowSelectorModal(false)} className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={addSelectedItems} disabled={!selectedItems.size} className="rounded-xl bg-[#b56d2d] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                Add ({selectedItems.size})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
