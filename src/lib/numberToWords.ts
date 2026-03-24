const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertHundreds(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  return (
    ones[Math.floor(n / 100)] +
    " Hundred" +
    (n % 100 !== 0 ? " " + convertHundreds(n % 100) : "")
  );
}

export function numberToWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "INR Zero Rupees Only";

  const crore = Math.floor(rounded / 10_000_000);
  const lakh = Math.floor((rounded % 10_000_000) / 100_000);
  const thousand = Math.floor((rounded % 100_000) / 1_000);
  const remainder = rounded % 1_000;

  let result = "";
  if (crore > 0) result += convertHundreds(crore) + " Crore ";
  if (lakh > 0) result += convertHundreds(lakh) + " Lakh ";
  if (thousand > 0) result += convertHundreds(thousand) + " Thousand ";
  if (remainder > 0) result += convertHundreds(remainder);

  return "INR " + result.trim() + " Rupees Only";
}
