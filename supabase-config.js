/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - SUPABASE FRONTEND CONFIG
   Plain browser JavaScript only. No secret keys here.

   Load before page-specific scripts like this:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="supabase-config.js"></script>
   <script src="login.js"></script>
   ============================================================ */

const SUPABASE_URL = "https://jhyedqmoaenkyzrgpvsc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__XbGNz6V9C8YIyprXv3L2Q_e-VDwbdl";

function setupHilltopSupabaseClient() {
  if (!window.supabase) {
    console.error("Supabase CDN script is not loaded yet.");
    window.hilltopSupabase = null;
    return;
  }

  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_URL.includes("YOUR_") ||
    SUPABASE_URL.includes("PASTE_") ||
    SUPABASE_PUBLISHABLE_KEY.includes("YOUR_") ||
    SUPABASE_PUBLISHABLE_KEY.includes("PASTE_")
  ) {
    console.warn("Supabase is not configured yet. Add your project URL and publishable/anon key in supabase-config.js.");
    window.hilltopSupabase = null;
    return;
  }

  window.hilltopSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.info("Supabase client initialized for Hilltop Properties Zambia.");
}

setupHilltopSupabaseClient();

// ============================================================
// HILLTOP PROPERTIES ZAMBIA - MOCK DATA FOR FRONTEND PREVIEW
// Used automatically when the remote Supabase database is empty.
// ============================================================

function getMockBranches() {
  return [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Lusaka', address: 'Kabulonga, Lusaka, Zambia', contact_number: '+260 979 972019' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Livingstone', address: 'Mosi-oa-Tunya Road, Livingstone, Zambia', contact_number: '+260 979 328 997' }
  ];
}

function getMockProperties() {
  return [
    {
      id: '10000000-0000-0000-0000-000000000001',
      reference_number: 'HT-LSK-001',
      title: '4-Bedroom Executive House in Kabulonga',
      description: 'Stunning executive residence in the prestigious Kabulonga area. Features high ceilings, modern finishes, a private garden, and beautiful architectural touches.',
      price: 2400000.00,
      currency_code: 'ZMW',
      purpose: 'For Sale',
      property_type: 'House',
      branch_id: '11111111-1111-1111-1111-111111111111',
      area: 'Kabulonga',
      full_address: 'Plot 18, Lilayi Road, Kabulonga, Lusaka',
      bedrooms: 4,
      bathrooms: 3,
      garages: 2,
      square_metres: 320,
      status: 'Active',
      featured: true,
      amenities: ['Pool', 'Garden', 'Security', 'Borehole'],
      created_at: new Date(Date.now() - 1000000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      reference_number: 'HT-LSK-002',
      title: '2-Bedroom Apartment in Levy Junction',
      description: 'Modern apartment in the Levy Junction complex. Perfect for young professionals or investment. Clean layout, security included.',
      price: 8500.00,
      currency_code: 'ZMW',
      purpose: 'For Rent',
      property_type: 'Apartment',
      branch_id: '11111111-1111-1111-1111-111111111111',
      area: 'Levy Junction',
      full_address: 'Levy Junction Complex, Lusaka',
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      square_metres: 95,
      status: 'Active',
      featured: false,
      amenities: ['Gym', 'Security', 'Parking'],
      created_at: new Date(Date.now() - 2000000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      reference_number: 'HT-LSK-003',
      title: 'Commercial Office Space - Cairo Road',
      description: 'Premium Grade-A commercial office space in the heart of Lusaka business district. High foot traffic, great road visibility.',
      price: 22000.00,
      currency_code: 'ZMW',
      purpose: 'For Rent',
      property_type: 'Commercial',
      branch_id: '11111111-1111-1111-1111-111111111111',
      area: 'Cairo Road',
      full_address: 'Cairo Road Central, Lusaka',
      bedrooms: 0,
      bathrooms: 2,
      garages: 4,
      square_metres: 450,
      status: 'Under Offer',
      featured: false,
      amenities: ['Parking', 'Reception', 'Server Room'],
      created_at: new Date(Date.now() - 3000000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      reference_number: 'HT-LSK-005',
      title: '1-Acre Residential Plot - Chalala',
      description: 'Prime residential plot in Chalala. Fully serviced with tarred road access, clean title deed, perfect for family development.',
      price: 980000.00,
      currency_code: 'ZMW',
      purpose: 'For Sale',
      property_type: 'Land',
      branch_id: '11111111-1111-1111-1111-111111111111',
      area: 'Chalala',
      full_address: 'Chalala Residential Area, Lusaka',
      bedrooms: 0,
      bathrooms: 0,
      garages: 0,
      square_metres: 4047,
      status: 'Active',
      featured: false,
      amenities: ['Title Deed', 'Serviced'],
      created_at: new Date(Date.now() - 4000000).toISOString()
    },
    {
      id: '10000000-0000-0000-0000-000000000008',
      reference_number: 'HT-LVN-002',
      title: 'Riverside Lodge Plot - Victoria Falls',
      description: 'Rare riverside plot with uninterrupted views of the Zambezi. Exceptional investment opportunity near Victoria Falls.',
      price: 3200000.00,
      currency_code: 'ZMW',
      purpose: 'For Sale',
      property_type: 'Land',
      branch_id: '22222222-2222-2222-2222-222222222222',
      area: 'Victoria Falls',
      full_address: 'Riverside Area, Livingstone',
      bedrooms: 0,
      bathrooms: 0,
      garages: 0,
      square_metres: 8000,
      status: 'Active',
      featured: true,
      amenities: ['River Frontage', 'Title Deed'],
      created_at: new Date(Date.now() - 5000000).toISOString()
    }
  ];
}

function getMockPropertyImages() {
  return [
    { property_id: '10000000-0000-0000-0000-000000000001', image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', display_order: 1, is_cover: true },
    { property_id: '10000000-0000-0000-0000-000000000001', image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', display_order: 2, is_cover: false },
    { property_id: '10000000-0000-0000-0000-000000000001', image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', display_order: 3, is_cover: false },
    { property_id: '10000000-0000-0000-0000-000000000002', image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', display_order: 1, is_cover: true },
    { property_id: '10000000-0000-0000-0000-000000000003', image_url: 'https://example.com/broken-office-image.jpg', display_order: 1, is_cover: true },
    { property_id: '10000000-0000-0000-0000-000000000008', image_url: 'https://example.com/broken-land-image.jpg', display_order: 1, is_cover: true }
  ];
}
