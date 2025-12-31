import { useState } from "react";
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
import { useMenuItems } from "@/hooks/useMenuItems";
import { MenuItem } from "@/types/pos";
import { Plus, Pencil, Trash2, Search, Image } from "lucide-react";
import { toast } from "sonner";

const FRUIT_ICONS = [
  { name: "Apple", emoji: "🍎" },
  { name: "Orange", emoji: "🍊" },
  { name: "Banana", emoji: "🍌" },
  { name: "Grapes", emoji: "🍇" },
  { name: "Watermelon", emoji: "🍉" },
  { name: "Strawberry", emoji: "🍓" },
  { name: "Lemon", emoji: "🍋" },
  { name: "Peach", emoji: "🍑" },
  { name: "Pineapple", emoji: "🍍" },
  { name: "Mango", emoji: "🥭" },
  { name: "Coconut", emoji: "🥥" },
  { name: "Kiwi", emoji: "🥝" },
  { name: "Avocado", emoji: "🥑" },
  { name: "Cherry", emoji: "🍒" },
  { name: "Blueberry", emoji: "🫐" },
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
}

export default function Menu() {
  const { menuItems, isLoading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuItems();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ 
    name: "", 
    price: "", 
    color: "#22c55e",
    image_url: ""
  });

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

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
        image_url: formData.image_url || null
      });
      setEditingItem(null);
    } else {
      addMenuItem.mutate({ 
        name, 
        price,
        color: formData.color,
        image_url: formData.image_url || undefined
      });
      setIsAddDialogOpen(false);
    }
    setFormData({ name: "", price: "", color: "#22c55e", image_url: "" });
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      price: item.price.toString(),
      color: item.color || "#22c55e",
      image_url: item.image_url || ""
    });
  };

  const closeEditDialog = () => {
    setEditingItem(null);
    setFormData({ name: "", price: "", color: "#22c55e", image_url: "" });
  };

  const handleDelete = (id: string) => {
    deleteMenuItem.mutate(id);
  };

  const toggleActive = (item: MenuItem) => {
    updateMenuItem.mutate({ id: item.id, is_active: !item.is_active });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  const MenuItemForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g., Orange Juice"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
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
          Icon
        </Label>
        <div className="flex flex-wrap gap-2 p-3 bg-secondary/50 rounded-lg max-h-32 overflow-y-auto">
          <button
            type="button"
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
              !formData.image_url 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setFormData({ ...formData, image_url: "" })}
          >
            <span className="text-muted-foreground text-xs">None</span>
          </button>
          {FRUIT_ICONS.map((icon) => (
            <button
              key={icon.emoji}
              type="button"
              className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                formData.image_url === icon.emoji 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setFormData({ ...formData, image_url: icon.emoji })}
              title={icon.name}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
            <p className="text-muted-foreground">Manage your juice menu items</p>
          </div>
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
                <Button onClick={handleSubmit} disabled={addMenuItem.isPending}>
                  {addMenuItem.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {search ? "No items match your search" : "No menu items yet. Add your first item!"}
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
                        <span className="text-2xl">{item.image_url}</span>
                      )}
                      <CardTitle className="text-lg">{item.name}</CardTitle>
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
              <Button onClick={handleSubmit} disabled={updateMenuItem.isPending}>
                {updateMenuItem.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}