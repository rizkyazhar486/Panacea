// Berkas gaya dimuat DI SINI (titik masuk malas rute /emergency), bukan di komponen: komponennya tetap
// dapat dirender oleh uji Node, dan CSS-nya hanya ikut chunk halaman ini sehingga tidak menambah CSS pemblokir.
import '../domains/emergency-card/ui/emergencyCard.css'
export * from './clinical/EmergencyCard'
export { default } from './clinical/EmergencyCard'
