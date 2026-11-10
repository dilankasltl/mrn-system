import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';
import seedItems from '@/lib/seedItems.json';
import { ensureCatalogSeeded, deduplicateDatabaseCatalog } from '@/lib/seedCatalog';

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
        // Fetch slightly extra to account for any on-the-fly deduplication
        const rawItems = await Item.find(query).sort({ itemNo: 1 }).skip(skip).limit(limit * 2).lean();

        // Strictly Deduplicate by description: only one item per description
        const seenDesc = new Set();
        items = [];
        for (const it of rawItems) {
          const k = (it.description || '').trim().toLowerCase();
          if (!seenDesc.has(k)) {
            seenDesc.add(k);
            items.push(it);
          }
          if (items.length >= limit) break;
        }

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

    // Deduplicate static results
    const staticSeen = new Set();
    const staticUnique = [];
    for (const it of filtered) {
      const k = (it.description || '').trim().toLowerCase();
      if (!staticSeen.has(k)) {
        staticSeen.add(k);
        staticUnique.push(it);
      }
    }

    total = staticUnique.length;
    items = staticUnique.slice(skip, skip + limit).map((it, idx) => ({
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
    const existingNo = await Item.findOne({ itemNo: itemNo.trim() });
    if (existingNo) {
      return NextResponse.json(
        { success: false, error: `Item with Item No "${itemNo.trim()}" already exists.` },
        { status: 409 }
      );
    }

    // Check if exact same description already exists (prevent duplicate descriptions)
    const existingDesc = await Item.findOne({
      description: { $regex: new RegExp(`^${escapeRegex(description.trim())}$`, 'i') },
    });
    if (existingDesc) {
      return NextResponse.json(
        {
          success: false,
          error: `An item with description "${description.trim()}" already exists in the catalog (Item No: ${existingDesc.itemNo}). Duplicate descriptions are not allowed.`,
        },
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
