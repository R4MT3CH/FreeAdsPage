'use client';
import AdForm from '@/components/AdForm'

const locationDefault = {
  lat: 37.773972,
  lng: -122.431297,
}

export default function NewAdPage() {
  return (
    <AdForm defaultLocation={locationDefault}/>
  );
}