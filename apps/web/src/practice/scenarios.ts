import type { Locale } from '@tapcare/shared';

export type Localized = Record<Locale, string>;

export type KioskVisual = 'qr' | 'keypad' | 'ticket' | 'queue-number' | 'receipt';

export interface KioskButton {
  id: string;
  label: Localized;
  /** Visual weight on the pretend kiosk. */
  tone?: 'primary' | 'neutral' | 'success';
  /** The button the learner should tap on this screen. */
  correct?: boolean;
}

export interface KioskScreen {
  id: string;
  heading: Localized;
  body?: Localized;
  visual?: KioskVisual;
  amount?: string;
  buttons: KioskButton[];
  /** What the coach says on this screen. */
  coach: Localized;
  /** Safety lesson attached to this screen. */
  safety?: Localized;
}

export interface Scenario {
  id: string;
  icon: 'train' | 'queue' | 'food';
  title: Localized;
  kioskName: string;
  screens: KioskScreen[];
  /** Shown after the last step, e.g. where to collect the ticket. */
  finale: Localized;
}

/**
 * Practice journeys modelled on common Indonesian self-service kiosks,
 * with fictional names. New scenarios are data only — no component changes needed.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'train-ticket',
    icon: 'train',
    title: { id: 'Beli tiket kereta', en: 'Buy a train ticket' },
    kioskName: 'KeretaKu',
    finale: {
      id: 'Ambil tiket Anda dari lubang di bawah layar.',
      en: 'Take your ticket from the slot below the screen.',
    },
    screens: [
      {
        id: 'welcome',
        heading: { id: 'Selamat datang', en: 'Welcome' },
        body: { id: 'Silakan pilih layanan', en: 'Please choose a service' },
        coach: { id: 'Tekan "Beli Tiket" untuk mulai.', en: 'Tap "Buy Ticket" to begin.' },
        buttons: [
          {
            id: 'buy',
            label: { id: 'Beli Tiket', en: 'Buy Ticket' },
            tone: 'primary',
            correct: true,
          },
          { id: 'topup', label: { id: 'Isi Ulang Kartu', en: 'Top Up Card' } },
          { id: 'help', label: { id: 'Bantuan', en: 'Help' } },
        ],
      },
      {
        id: 'destination',
        heading: { id: 'Pilih stasiun tujuan', en: 'Choose your destination' },
        coach: {
          id: 'Misalnya Anda ke Stasiun Taman. Tekan "Stasiun Taman".',
          en: 'Say you are going to Taman Station. Tap "Taman Station".',
        },
        buttons: [
          { id: 'kota', label: { id: 'Stasiun Kota', en: 'Kota Station' } },
          { id: 'taman', label: { id: 'Stasiun Taman', en: 'Taman Station' }, correct: true },
          { id: 'merdeka', label: { id: 'Stasiun Merdeka', en: 'Merdeka Station' } },
          { id: 'pasar', label: { id: 'Stasiun Pasar', en: 'Pasar Station' } },
        ],
      },
      {
        id: 'quantity',
        heading: { id: 'Jumlah tiket', en: 'Number of tickets' },
        body: { id: '1 tiket · Rp5.000', en: '1 ticket · Rp5,000' },
        coach: {
          id: 'Satu tiket sudah benar. Tekan "Lanjut".',
          en: 'One ticket is right. Tap "Next".',
        },
        buttons: [
          { id: 'cancel', label: { id: 'Batal', en: 'Cancel' } },
          { id: 'next', label: { id: 'Lanjut', en: 'Next' }, tone: 'success', correct: true },
        ],
      },
      {
        id: 'payment',
        heading: { id: 'Metode pembayaran', en: 'Payment method' },
        amount: 'Rp5.000',
        coach: {
          id: 'Pilih "QRIS" untuk bayar dengan aplikasi di ponsel.',
          en: 'Choose "QRIS" to pay with your phone app.',
        },
        safety: { id: 'Periksa jumlahnya dulu: Rp5.000.', en: 'Check the amount first: Rp5,000.' },
        buttons: [
          { id: 'qris', label: { id: 'QRIS', en: 'QRIS' }, tone: 'primary', correct: true },
          { id: 'card', label: { id: 'Kartu Debit', en: 'Debit Card' } },
          { id: 'cash', label: { id: 'Tunai', en: 'Cash' } },
        ],
      },
      {
        id: 'scan',
        heading: { id: 'Pindai untuk membayar', en: 'Scan to pay' },
        visual: 'qr',
        amount: 'Rp5.000',
        coach: {
          id: 'Di kiosk asli, pindai kode ini dengan aplikasi bank. Di latihan, tekan "Saya sudah bayar".',
          en: 'At a real kiosk, scan this code with your bank app. Here, tap "I have paid".',
        },
        buttons: [
          {
            id: 'paid',
            label: { id: 'Saya sudah bayar', en: 'I have paid' },
            tone: 'success',
            correct: true,
          },
        ],
      },
    ],
  },
  {
    id: 'queue-number',
    icon: 'queue',
    title: { id: 'Ambil nomor antrean', en: 'Get a queue number' },
    kioskName: 'Antre Sehat',
    finale: {
      id: 'Ambil kertas nomor antrean, lalu tunggu nomor Anda dipanggil.',
      en: 'Take the queue slip, then wait for your number to be called.',
    },
    screens: [
      {
        id: 'welcome',
        heading: { id: 'Klinik Sehat Bersama', en: 'Sehat Bersama Clinic' },
        body: { id: 'Sentuh layar untuk mengambil nomor', en: 'Touch the screen to take a number' },
        coach: { id: 'Tekan "Ambil Nomor Antrean".', en: 'Tap "Take Queue Number".' },
        buttons: [
          {
            id: 'start',
            label: { id: 'Ambil Nomor Antrean', en: 'Take Queue Number' },
            tone: 'primary',
            correct: true,
          },
        ],
      },
      {
        id: 'service',
        heading: { id: 'Pilih layanan', en: 'Choose a service' },
        coach: {
          id: 'Untuk periksa dokter umum, tekan "Poli Umum".',
          en: 'To see a general doctor, tap "General Clinic".',
        },
        buttons: [
          { id: 'general', label: { id: 'Poli Umum', en: 'General Clinic' }, correct: true },
          { id: 'dental', label: { id: 'Poli Gigi', en: 'Dental' } },
          { id: 'pharmacy', label: { id: 'Farmasi', en: 'Pharmacy' } },
          { id: 'lab', label: { id: 'Laboratorium', en: 'Laboratory' } },
        ],
      },
      {
        id: 'confirm',
        heading: { id: 'Konfirmasi', en: 'Confirm' },
        body: {
          id: 'Poli Umum · Estimasi tunggu 20 menit',
          en: 'General Clinic · About 20 minutes wait',
        },
        coach: {
          id: 'Benar Poli Umum. Tekan "Cetak Nomor".',
          en: 'General Clinic is right. Tap "Print Number".',
        },
        buttons: [
          { id: 'back', label: { id: 'Ubah', en: 'Change' } },
          {
            id: 'print',
            label: { id: 'Cetak Nomor', en: 'Print Number' },
            tone: 'success',
            correct: true,
          },
        ],
      },
    ],
  },
  {
    id: 'food-order',
    icon: 'food',
    title: { id: 'Pesan makanan', en: 'Order food' },
    kioskName: 'Warung Cepat',
    finale: {
      id: 'Ambil struk Anda dan tunggu nomor pesanan dipanggil.',
      en: 'Take your receipt and wait for your order number.',
    },
    screens: [
      {
        id: 'welcome',
        heading: { id: 'Makan di mana?', en: 'Where will you eat?' },
        coach: {
          id: 'Kalau mau makan di tempat, tekan "Makan di Sini".',
          en: 'To eat here, tap "Eat Here".',
        },
        buttons: [
          {
            id: 'here',
            label: { id: 'Makan di Sini', en: 'Eat Here' },
            tone: 'primary',
            correct: true,
          },
          { id: 'away', label: { id: 'Bawa Pulang', en: 'Take Away' } },
        ],
      },
      {
        id: 'menu',
        heading: { id: 'Pilih menu', en: 'Choose a dish' },
        coach: { id: 'Tekan "Nasi Ayam" untuk memesannya.', en: 'Tap "Chicken Rice" to order it.' },
        buttons: [
          {
            id: 'chicken',
            label: { id: 'Nasi Ayam · Rp25.000', en: 'Chicken Rice · Rp25,000' },
            correct: true,
          },
          { id: 'noodle', label: { id: 'Mie Goreng · Rp22.000', en: 'Fried Noodles · Rp22,000' } },
          { id: 'tea', label: { id: 'Es Teh · Rp8.000', en: 'Iced Tea · Rp8,000' } },
        ],
      },
      {
        id: 'cart',
        heading: { id: 'Pesanan Anda', en: 'Your order' },
        body: { id: '1× Nasi Ayam', en: '1× Chicken Rice' },
        amount: 'Rp25.000',
        coach: {
          id: 'Periksa pesanan, lalu tekan "Bayar".',
          en: 'Check your order, then tap "Pay".',
        },
        safety: {
          id: 'Pastikan totalnya Rp25.000 sebelum membayar.',
          en: 'Make sure the total is Rp25,000 before paying.',
        },
        buttons: [
          { id: 'add', label: { id: 'Tambah Menu', en: 'Add More' } },
          { id: 'pay', label: { id: 'Bayar', en: 'Pay' }, tone: 'success', correct: true },
        ],
      },
      {
        id: 'method',
        heading: { id: 'Cara bayar', en: 'Payment method' },
        amount: 'Rp25.000',
        coach: { id: 'Tekan "Kartu Debit".', en: 'Tap "Debit Card".' },
        buttons: [
          { id: 'qris', label: { id: 'QRIS', en: 'QRIS' } },
          {
            id: 'debit',
            label: { id: 'Kartu Debit', en: 'Debit Card' },
            tone: 'primary',
            correct: true,
          },
        ],
      },
      {
        id: 'pin',
        heading: { id: 'Masukkan PIN di mesin EDC', en: 'Enter your PIN on the card machine' },
        visual: 'keypad',
        amount: 'Rp25.000',
        coach: {
          id: 'Di kiosk asli, ketik PIN sendiri di mesin kartu. Di latihan, tekan "PIN sudah diketik".',
          en: 'At a real kiosk, type your PIN on the card machine yourself. Here, tap "PIN entered".',
        },
        safety: {
          id: 'Tutupi tombol dengan tangan lain. Jangan pernah memberi tahu PIN kepada siapa pun — TapCare juga tidak akan memintanya.',
          en: 'Cover the keypad with your other hand. Never tell anyone your PIN — TapCare will never ask for it.',
        },
        buttons: [
          {
            id: 'entered',
            label: { id: 'PIN sudah diketik', en: 'PIN entered' },
            tone: 'success',
            correct: true,
          },
        ],
      },
    ],
  },
];

export const findScenario = (id: string) => SCENARIOS.find((scenario) => scenario.id === id);
