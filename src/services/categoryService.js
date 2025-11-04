// Simulasi layanan kategori untuk manajemen data
// Ini akan digunakan sebagai mock data untuk kebutuhan pengembangan

// Menyimpan data kategori dalam array
let categories = [
  {
    id: "1",
    name: "Pribadi",
    color: "#FF6B6B",
    userId: "user1",
    description: "Kategori untuk catatan pribadi",
    parentId: null,
    createdAt: new Date("2023-01-15"),
    $createdAt: new Date("2023-01-15"),
    $updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    name: "Kerja",
    color: "#4ECDC4",
    userId: "user1",
    description: "Kategori untuk catatan kerja",
    parentId: null,
    createdAt: new Date("2023-01-20"),
    $createdAt: new Date("2023-01-20"),
    $updatedAt: new Date("2023-01-20"),
  },
  {
    id: "3",
    name: "Belajar",
    color: "#45B7D1",
    userId: "user1",
    description: "Kategori untuk catatan belajar",
    parentId: null,
    createdAt: new Date("2023-02-10"),
    $createdAt: new Date("2023-02-10"),
    $updatedAt: new Date("2023-02-10"),
  },
];

// Fungsi untuk mendapatkan semua kategori
export const getAllCategories = (userId = null) => {
  if (userId) {
    return categories.filter((category) => category.userId === userId);
  }
  return [...categories];
};

// Fungsi untuk mendapatkan kategori berdasarkan ID
export const getCategoryById = (id) => {
  return categories.find((category) => category.id === id);
};

// Fungsi untuk menambah kategori baru
export const createCategory = (categoryData) => {
  const newCategory = {
    id: generateId(),
    ...categoryData,
    createdAt: new Date(),
    $createdAt: new Date(),
    $updatedAt: new Date(),
  };
  categories.push(newCategory);
  return newCategory;
};

// Fungsi untuk memperbarui kategori
export const updateCategory = (id, categoryData) => {
  const index = categories.findIndex((category) => category.id === id);
  if (index !== -1) {
    categories[index] = {
      ...categories[index],
      ...categoryData,
      $updatedAt: new Date(),
    };
    return categories[index];
  }
  return null;
};

// Fungsi untuk menghapus kategori
export const deleteCategory = (id) => {
  const index = categories.findIndex((category) => category.id === id);
  if (index !== -1) {
    const deletedCategory = categories.splice(index, 1)[0];
    return deletedCategory;
  }
  return null;
};

// Fungsi pembantu untuk menghasilkan ID unik
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};
