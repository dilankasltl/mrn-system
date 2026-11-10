import Item from '@/models/Item';
import seedItems from '@/lib/seedItems.json';

export async function deduplicateDatabaseCatalog() {
  try {
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$description' } } },
          docs: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate descriptions in database. Deduplicating...`);
      const idsToDelete = [];
      for (const group of duplicates) {
        // Keep the first document, delete subsequent duplicates
        const toDelete = group.docs.slice(1);
        idsToDelete.push(...toDelete);
      }
      if (idsToDelete.length > 0) {
        await Item.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Deleted ${idsToDelete.length} duplicate description items from database.`);
      }
    }
  } catch (err) {
    console.error('Error deduplicating database items:', err);
  }
}

export async function ensureCatalogSeeded() {
  try {
    const count = await Item.countDocuments();
    if (count === 0 && Array.isArray(seedItems) && seedItems.length > 0) {
      console.log(`Seeding ${seedItems.length} unique items into Item catalog...`);
      const CHUNK_SIZE = 2500;
      for (let i = 0; i < seedItems.length; i += CHUNK_SIZE) {
        const chunk = seedItems.slice(i, i + CHUNK_SIZE).map((item) => ({
          itemNo: String(item.itemNo || '').trim(),
          description: String(item.description || '').trim(),
          uom: String(item.uom || 'NOS').trim().toUpperCase(),
          createdBy: 'System Seed',
        }));
        await Item.insertMany(chunk, { ordered: false });
      }
      console.log(`Item catalog seeded successfully.`);
    } else {
      // Clean up any existing duplicate descriptions
      await deduplicateDatabaseCatalog();
    }
  } catch (err) {
    console.error('Error seeding item catalog:', err);
  }
}
