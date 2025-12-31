import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useCategories } from "@/hooks/useCategories";
import { MenuItem } from "@/types/pos";
import { Plus, Pencil, Trash2, Search, Image, Upload, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FRUIT_ICONS = [
  "🍎", "🍊", "🍌", "🍇", "🍉", "🍓", "🍋", "🍑", "🍍", "🥭", 
  "🥥", "🥝", "🥑", "🍒", "🫐", "🍐", "🍈", "🥒", "🥕", "🍅",
  "🥬", "🥦", "🌽", "🧃", "🥤", "🧊", "🍵", "☕", "🥛", "🍯"
];

const COLOR_OPTIONS = [
  { name: "Green", value: "#22c55e" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Teal", value: "#14b8a6" },
];

interface FormData {
  name: string;
  price: string;
  color: string;
  image_url: string;
  category: string;
}

export default function Menu() {
  const { menuItems, isLoading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuItems();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ 
    name: "", 
    price: "", 
    color: "#22c55e",
    image_url: "",
    category: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Category management state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    const name = formData.name.trim();
    const price = parseFloat(formData.price);

    if (!name) {
      toast.error("Please enter a name");
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }

    if (editingItem) {
      updateMenuItem.mutate({ 
        id: editingItem.id, 
        name, 
        price,
        color: formData.color,
        image_url: formData.image_url || null,
        category: formData.category || null
      });
      setEditingItem(null);
    } else {
      addMenuItem.mutate({ 
        name, 
        price,
        color: formData.color,
        image_url: formData.image_url || undefined,
        category: formData.category || undefined
      });
      setIsAddDialogOpen(false);
    }
    setFormData({ name: "", price: "", color: "#22c55e", image_url: "", category: "" });
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      price: item.price.toString(),
      color: item.color || "#22c55e",
      image_url: item.image_url || "",
      category: item.category || ""
    });
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setFormData({ name: "", price: "", color: "#22c55e", image_url: "", category: "" });
  };

  const handleDelete = (id: string) => {
    deleteMenuItem.mutate(id);
  };

  const toggleActive = (item: MenuItem) => {
    updateMenuItem.mutate({ id: item.id, is_active: !item.is_active });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  const isEmoji = (str: string) => {
    return /\p{Emoji}/u.test(str) && str.length <= 4;
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Please enter a category name");
      return;
    }
    addCategory.mutate(name, {
      onSuccess: () => setNewCategoryName("")
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    const name = editingCategory.name.trim();
    if (!name) {
      toast.error("Please enter a category name");
      return;
    }
    updateCategory.mutate({ id: editingCategory.id, name }, {
      onSuccess: () => setEditingCategory(null)
    });
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory.mutate(id);
  };

  const MenuItemForm = () => (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g., Orange Juice"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            min="1"
            step="1"
            placeholder="e.g., 50"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Color Selection */}
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                formData.color === color.value 
                  ? "border-foreground scale-110" 
                  : "border-transparent"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => setFormData({ ...formData, color: color.value })}
              title={color.name}
            />
          ))}
        </div>
      </div>
      
      {/* Icon/Image Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Icon / Image
        </Label>
        <div className="space-y-3">
          {/* Preview current image */}
          {formData.image_url && (
            <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
              {isEmoji(formData.image_url) ? (
                <span className="text-3xl">{formData.image_url}</span>
              ) : (
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <span className="flex-1 text-sm text-muted-foreground truncate">
                {isEmoji(formData.image_url) ? "Emoji icon" : "Custom image"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setFormData({ ...formData, image_url: "" })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Upload button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          
          {/* Quick pick emoji icons */}
          <div className="flex flex-wrap gap-1.5 p-3 bg-secondary/50 rounded-lg max-h-28 overflow-y-auto">
            {FRUIT_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                  formData.image_url === emoji 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormData({ ...formData, image_url: emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with fruit pattern background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 p-6">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 left-8 text-6xl">🍌</div>
            <div className="absolute top-4 right-16 text-5xl">🥝</div>
            <div className="absolute bottom-2 left-1/3 text-4xl">🍇</div>
            <div className="absolute bottom-4 right-8 text-5xl">🍋</div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
              <p className="text-muted-foreground">Manage your juice menu items</p>
            </div>
          <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="touch-action-manipulation">
                  <Settings className="h-5 w-5 mr-2" />
                  Categories
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Add new category */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="New category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} disabled={addCategory.isPending}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Category list */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                        {editingCategory?.id === cat.id ? (
                          <>
                            <Input
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory()}
                              className="flex-1"
                            />
                            <Button size="icon" variant="ghost" onClick={handleUpdateCategory}>
                              ✓
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingCategory(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 font-medium">{cat.name}</span>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will delete the category. Menu items in this category will remain but become uncategorized.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No categories yet. Add your first category above.
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="touch-action-manipulation">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                </DialogHeader>
                <MenuItemForm />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={addMenuItem.isPending || isUploading}>
                    {addMenuItem.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search || categoryFilter !== "all" 
                ? "No items match your filters" 
                : "No menu items yet. Add your first item!"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`shadow-md transition-opacity ${!item.is_active ? "opacity-60" : ""}`}
                style={{ borderLeftWidth: "4px", borderLeftColor: item.color || "#22c55e" }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.image_url && (
                        isEmoji(item.image_url) ? (
                          <span className="text-2xl">{item.image_url}</span>
                        ) : (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )
                      )}
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <span className="text-xs text-muted-foreground">{item.category || "Uncategorized"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => toggleActive(item)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: item.color || "hsl(var(--primary))" }}
                    >
                      {formatCurrency(Number(item.price))}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                        className="touch-action-manipulation"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive touch-action-manipulation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this
                              menu item.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <MenuItemForm />
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updateMenuItem.isPending || isUploading}>
                {updateMenuItem.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}