import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bill, BillItem, OrderItem, PaymentMethod } from "@/types/pos";
import { toast } from "sonner";
import { useEffect } from "react";

const PARCEL_CHARGE = 5;

export function useBills() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayBills = [], isLoading } = useQuery({
    queryKey: ["bills", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("business_date", today)
        .order("date_time", { ascending: false });

      if (error) throw error;
      return data as Bill[];
    },
  });

  const { data: billItems = [] } = useQuery({
    queryKey: ["bill-items", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_items")
        .select("*, bills!inner(*)")
        .eq("bills.business_date", today);

      if (error) throw error;
      return data as (BillItem & { bills: Bill })[];
    },
  });

  const { data: last30DaysBills = [] } = useQuery({
    queryKey: ["bills-30-days"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .gte("business_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("business_date");

      if (error) throw error;
      return data as Bill[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("bills-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bills"] });
          queryClient.invalidateQueries({ queryKey: ["bills-30-days"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bill_items" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bill-items"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createBill = useMutation({
    mutationFn: async ({
      items,
      paymentMethod,
      applyParcelToAll,
    }: {
      items: OrderItem[];
      paymentMethod: PaymentMethod;
      applyParcelToAll: boolean;
    }) => {
      // Calculate totals
      let subtotal = 0;
      let totalParcelCollected = 0;

      const billItems = items.map((item) => {
        const lineSubtotal = item.quantity * item.menuItem.price;
        const parcelQty = applyParcelToAll ? item.quantity : item.parcelQuantity;
        const parcelTotal = parcelQty * PARCEL_CHARGE;
        const lineTotal = lineSubtotal + parcelTotal;

        subtotal += lineSubtotal;
        totalParcelCollected += parcelTotal;

        return {
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          price_per_unit: item.menuItem.price,
          line_subtotal: lineSubtotal,
          is_parcel: applyParcelToAll || item.isParcel,
          parcel_quantity: parcelQty,
          parcel_charge_per_unit: PARCEL_CHARGE,
          parcel_total: parcelTotal,
          line_total: lineTotal,
        };
      });

      const totalAmount = subtotal + totalParcelCollected;

      // Create bill
      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
          subtotal,
          total_parcel_collected: totalParcelCollected,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          apply_parcel_to_all: applyParcelToAll,
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const { error: itemsError } = await supabase
        .from("bill_items")
        .insert(billItems.map((item) => ({ ...item, bill_id: bill.id })));

      if (itemsError) throw itemsError;

      return bill as Bill;
    },
    onSuccess: (bill) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill-items"] });
      queryClient.invalidateQueries({ queryKey: ["bills-30-days"] });
      toast.success(`Bill #${bill.bill_number} generated successfully!`);
    },
    onError: (error) => {
      toast.error("Failed to create bill: " + error.message);
    },
  });

  // Calculate today's stats
  const salesToday = todayBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
  const ordersToday = todayBills.length;
  const parcelChargesCollected = todayBills.reduce(
    (sum, bill) => sum + Number(bill.total_parcel_collected),
    0
  );
  const averageBillValue = ordersToday > 0 ? salesToday / ordersToday : 0;

  // Cash vs UPI split
  const cashTotal = todayBills
    .filter((bill) => bill.payment_method === "Cash")
    .reduce((sum, bill) => sum + Number(bill.total_amount), 0);
  const upiTotal = todayBills
    .filter((bill) => bill.payment_method === "UPI")
    .reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  return {
    todayBills,
    billItems,
    last30DaysBills,
    isLoading,
    createBill,
    stats: {
      salesToday,
      ordersToday,
      parcelChargesCollected,
      averageBillValue,
      cashTotal,
      upiTotal,
    },
  };
}