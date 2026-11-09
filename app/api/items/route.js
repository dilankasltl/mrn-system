import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import seedItems from '@/lib/seedItems.json';
import { ensureCatalogSeeded } from '@/lib/seedCatalog';

export const dynamic = 'force-dynamic';

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const skip = (page - 1) * limit;

    let items = [];
    let total = 0;

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (e) {
      console.warn('MongoDB connection issue in items route, falling back to static catalog:', e.message);
    }

    if (dbConnected) {
      const dbCount = await Item.countDocuments();
      if (dbCount === 0) {
        // Kick off seeding in background if not already seeded
        ensureCatalogSeeded().catch((err) => console.error('Seed error:', err));
      }

      if (dbCount > 0) {
        let query = {};
        if (search) {
          const safeRegex = new RegExp(escapeRegex(search), 'i');
          query = {
            $or: [{ itemNo: { $regex: safeRegex } }, { description: { $regex: safeRegex } }],
          };
        }

        total = await Item.countDocuments(query);
        items = await Item.find(query).sort({ itemNo: 1 }).skip(skip).limit(limit).lean();

        return NextResponse.json({
          success: true,
          items,
          total,
          page,
          totalPages: Math.ceil(total / limit) || 1,
        });
      }
    }

    // Fallback to static seedItems in memory if DB is empty or connecting
    let filtered = seedItems;
    if (search) {
      const q = search.toLowerCase();
      filtered = seedItems.filter(
        (it) =>
          (it.itemNo && it.itemNo.toLowerCase().includes(q)) ||
          (it.description && it.description.toLowerCase().includes(q))
      );
    }
    total = filtered.length;
    items = filtered.slice(skip, skip + limit).map((it, idx) => ({
      _id: `seed_${skip + idx}`,
      itemNo: it.itemNo,
      description: it.description,
      uom: it.uom || 'NOS',
      createdBy: 'System Seed',
    }));

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { itemNo, description, uom, userRole, userName } = body;

    // Permissions: Only Admin and Stores can add items
    const role = (userRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'stores') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Admin and Stores can add new items.' },
        { status: 403 }
      );
    }

    if (!itemNo || !itemNo.trim()) {
      return NextResponse.json({ success: false, error: 'Item No is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 });
    }

    // Check if itemNo already exists
    const existing = await Item.findOne({ itemNo: itemNo.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Item with Item No "${itemNo.trim()}" already exists.` },
        { status: 409 }
      );
    }

    const newItem = await Item.create({
      itemNo: itemNo.trim(),
      description: description.trim(),
      uom: (uom || 'NOS').trim().toUpperCase(),
      createdBy: userName || (role === 'admin' ? 'Admin' : 'Stores'),
    });

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'Item added successfully to Master Catalog.',
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}
