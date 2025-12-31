import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/types/pos";
import { toast } from "sonner";

export function useMenuItems() {
  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const addMenuItem = useMutation({
    mutationFn: async (item: { name: string; price: number; color?: string; image_url?: string }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu item added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add menu item: " + error.message);
    },
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu item updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update menu item: " + error.message);
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Menu item deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete menu item: " + error.message);
    },
  });

  const activeMenuItems = menuItems.filter((item) => item.is_active);

  return {
    menuItems,
    activeMenuItems,
    isLoading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };
}