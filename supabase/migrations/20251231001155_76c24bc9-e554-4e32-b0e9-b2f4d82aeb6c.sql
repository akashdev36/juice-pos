-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bills table with auto-incrementing bill number
CREATE SEQUENCE public.bill_number_seq START 1;

CREATE TABLE public.bills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_number INTEGER NOT NULL DEFAULT nextval('public.bill_number_seq') UNIQUE,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_parcel_collected NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI')),
    apply_parcel_to_all BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_items table
CREATE TABLE public.bill_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit NUMERIC(10,2) NOT NULL,
    line_subtotal NUMERIC(10,2) NOT NULL,
    is_parcel BOOLEAN NOT NULL DEFAULT false,
    parcel_quantity INTEGER NOT NULL DEFAULT 0,
    parcel_charge_per_unit NUMERIC(10,2) NOT NULL DEFAULT 5,
    parcel_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Create public access policies (shop POS - no auth required)
CREATE POLICY "Allow public read menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert menu_items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update menu_items" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete menu_items" ON public.menu_items FOR DELETE USING (true);

CREATE POLICY "Allow public read bills" ON public.bills FOR SELECT USING (true);
CREATE POLICY "Allow public insert bills" ON public.bills FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read bill_items" ON public.bill_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert bill_items" ON public.bill_items FOR INSERT WITH CHECK (true);

-- Enable realtime for bills (for dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bill_items;