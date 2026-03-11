export const formatImageUrl = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1545173168-9f18c82b997e?w=800&q=80";
  
  // If it's already a full web URL (like Cloudinary), return it as is
  if (url.startsWith("http")) return url;
  
  // If it's an old local path (like /uploads/...), point it to the Render server
  const serverBase = "https://elabada-server-25wz.onrender.com";
  return `${serverBase}${url.startsWith("/") ? "" : "/"}${url}`;
};
