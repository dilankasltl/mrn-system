import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/models/Item';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    const { itemNo, description, uom, userRole, userName } = body;

    // Only Admin can edit items
    const role = (userRole || '').toLowerCase();
    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Admin is permitted to edit items.' },
        { status: 403 }
      );
    }

    if (!itemNo || !itemNo.trim()) {
      return NextResponse.json({ success: false, error: 'Item No is required.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required.' }, { status: 400 });
    }

    const updated = await Item.findByIdAndUpdate(
      id,
      {
        itemNo: itemNo.trim(),
        description: description.trim(),
        uom: (uom || 'NOS').trim().toUpperCase(),
        updatedBy: userName || 'Admin',
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Item not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      item: updated,
      message: 'Item updated successfully.',
    });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const userRole = (searchParams.get('userRole') || '').toLowerCase();

    // Only Admin can delete items
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Admin is permitted to delete items.' },
        { status: 403 }
      );
    }

    const deleted = await Item.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Item not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully from Master Catalog.',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
