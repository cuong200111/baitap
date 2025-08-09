import { generateAdminMetadata } from '@/lib/admin-metadata';

export async function generateMetadata() {
  return await generateAdminMetadata({
    title: undefined, // Use default site name from admin settings
    description: undefined, // Use default site description from admin settings
    path: '/',
    type: 'page',
  });
}
