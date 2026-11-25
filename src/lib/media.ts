export const MEDIA = {
  heroBanner: '/src/assets/images/hero_three_shoes_oat_1795632277300.jpg',
  // Exact user-supplied product photos
  boysBlackPrimary: '/assets/aistudio/image_0ae15fd1.png',
  girlsMaryJanePrimary: '/assets/aistudio/image_5c8c1ded.png',
  whiteUnisexPrimary: '/assets/aistudio/image_9912ee39.png',
  // Matching studio angles & cutaways generated from user-supplied photos
  boysCutaway: '/src/assets/images/boys_cutaway_horizontal_1795632275378.jpg',
  girlsCutaway: '/src/assets/images/girls_cutaway_horizontal_1795632276317.jpg',
  whiteCutaway: '/src/assets/images/white_unisex_cutaway_1795632275840.jpg',
  boysTopInsert: '/src/assets/images/boys_top_blue_insert_1795632275667.jpg',
  girlsTopInsert: '/src/assets/images/girls_top_blue_insert_clean_1795632295387.jpg',
  whiteTopInsert: '/src/assets/images/white_top_blue_insert_1795632277098.jpg',
  blackRearHeel: '/src/assets/images/shoe_rear_heel_oat_1795632277842.jpg',
  whiteRearHeel: '/src/assets/images/white_rear_heel_oat_1795632278478.jpg',
  shoeOutsoleBlack: '/src/assets/images/shoe_outsole_black_1795628344158.jpg',
  shoeOutsoleWhite: '/src/assets/images/shoe_outsole_white_1795628272357.jpg',
  blueEvaInsert: '/src/assets/images/blue_eva_insert_closeup_1795628273599.jpg',
  ventilationPores: '/src/assets/images/ventilation_pores_closeup_1795628288152.jpg',
} as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
