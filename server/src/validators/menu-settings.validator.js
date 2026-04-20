import { z } from "zod";

const menuItemSchema = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    url: z.string().min(1),
    link: z.string().optional(),
    type: z.string().optional(),
    submenu: z.array(menuItemSchema).optional()
  })
);

export const updateMenuSettingsSchema = z.object({
  browseMenu: z.array(menuItemSchema).default([]),
  topBarMenu: z.array(menuItemSchema).default([]),
  mainNavMenu: z.array(menuItemSchema).default([]),
  footerFirstMenu: z.array(menuItemSchema).default([]),
  footerMenu: z.array(menuItemSchema).default([]),
  policiesMenu: z.array(menuItemSchema).default([])
});
