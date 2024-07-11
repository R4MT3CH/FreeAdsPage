import {faCar, faHome, faMobile, faTshirt, faSpa, faScrewdriverWrench,faChair, faBriefcase} from "@fortawesome/free-solid-svg-icons";
import mongoose from "mongoose";

export async function connect() {
  return mongoose.connect(process.env.MONGODB_URL as string);
}

export const categories = [
  {key:'properties', label:'Property Rental', icon: faHome},
  {key:'cars', label:'Cars', icon: faCar},
  {key:'electronics', label:'Electronics', icon: faMobile},
  {key:'clothes', label:'Apparel', icon: faTshirt},
  {key:'Home', label:'Home Good', icon: faChair},
  {key:'service', label:'Service', icon: faScrewdriverWrench},
  {key:'job', label:'Jobs', icon: faBriefcase},
  {key:'spa', label:'Spa & Massage', icon: faSpa},
];

export function formatMoney(amount: number): string {
  return '$' + Intl.NumberFormat('US', {currency: 'USD'}).format(amount);
}

export function formatDate(date: Date):string {
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export const defaultRadius = 50 * 1000;