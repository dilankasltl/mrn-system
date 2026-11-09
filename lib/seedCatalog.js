import Item from '@/models/Item';
import seedItems from '@/lib/seedItems.json';

export async function ensureCatalogSeeded() {
  try {
    const count = await Item.countDocuments();
    if (count === 0 && Array.isArray(seedItems) && seedItems.length > 0) {
      console.log(`Seeding ${seedItems.length} items into Item catalog...`);
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
    }
  } catch (err) {
    console.error('Error seeding item catalog:', err);
  }
}
