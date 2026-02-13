
// Danh sách lời chúc có sẵn, không cần API
const COSMIC_MESSAGES = [
  "Vũ trụ này rộng lớn vô tận, nhưng vẫn không chứa nổi tình yêu anh dành cho em.",
  "Mỗi vì sao trên bầu trời đêm nay đều đang tỏa sáng để chúc mừng tình yêu của chúng ta.",
  "Em là trung tâm của vũ trụ, còn anh là vệ tinh nguyện quay quanh em đến vĩnh hằng.",
  "Dù vạn vật có đổi thay, tình yêu anh dành cho em vẫn sáng mãi như dải ngân hà.",
  "Khoảng cách hàng triệu năm ánh sáng cũng không thể ngăn cản trái tim anh tìm về bên em.",
  "Trong hàng tỷ thiên hà, tìm thấy em là phép màu đẹp nhất của vũ trụ dành cho anh.",
  "Tình yêu của chúng ta rực rỡ hơn cả vụ nổ Big Bang đã khai sinh ra vũ trụ này.",
  "Nếu nỗi nhớ là một ngôi sao, anh đã tạo ra cả một bầu trời đầy sao cho em.",
  "Em không phải là một ngôi sao, em là cả vũ trụ của anh.",
  "Anh yêu em đến tận cùng của thời gian và không gian.",
  "Trọng lực không thể giữ chân anh, chỉ có tình yêu của em mới làm được điều đó.",
  "Nguyện cùng em bay qua mọi tinh vân, khám phá mọi bí ẩn của dải ngân hà này."
];

export const generateLoveMessage = async (name: string = "người thương"): Promise<string> => {
  // Giả lập thời gian chờ để tạo cảm giác "đang xử lý" (hiệu ứng UX)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Chọn ngẫu nhiên một câu chúc
  const randomIndex = Math.floor(Math.random() * COSMIC_MESSAGES.length);
  return COSMIC_MESSAGES[randomIndex];
};
