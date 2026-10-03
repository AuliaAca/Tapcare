import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App.tsx';
import { ApiError, type requestGuidance } from '../src/lib/api.ts';
import type * as ImageModule from '../src/lib/image.ts';
import type { CapturedFrame } from '../src/lib/image.ts';
import { guidance, renderWithSettings } from './render.tsx';

const frame: CapturedFrame = {
  previewUrl: 'data:image/jpeg;base64,AAAA',
  image: { mediaType: 'image/jpeg', data: 'A'.repeat(200), width: 1280, height: 960 },
};

vi.mock('../src/lib/image.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof ImageModule>()),
  captureVideoFrame: () => frame,
  fileToFrame: async () => frame,
}));

const stopTrack = vi.fn();

function mockCamera(
  getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
) {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  return getUserMedia;
}

beforeEach(() => {
  window.history.replaceState(null, '');
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    configurable: true,
    get: () => 1280,
  });
  mockCamera();
});

afterEach(() => {
  stopTrack.mockClear();
});

async function startLiveFlow(request: typeof requestGuidance) {
  const user = userEvent.setup();
  renderWithSettings(<App request={request} />);
  await user.click(screen.getByRole('button', { name: /bantu saya sekarang/i }));
  await user.click(await screen.findByRole('button', { name: /beli tiket kereta/i }));
  await user.click(screen.getByRole('button', { name: /lanjut/i }));
  const capture = await screen.findByRole('button', { name: /lihat layar/i });
  await waitFor(() => expect(capture).toBeEnabled());
  return { user, capture };
}

describe('live guidance flow', () => {
  it('guides step by step until the goal is done', async () => {
    const request = vi
      .fn<typeof requestGuidance>()
      .mockResolvedValueOnce(guidance())
      .mockResolvedValueOnce(
        guidance({ status: 'done', target: null, instruction: 'Ambil tiket Anda.', stepNumber: 2 }),
      );
    const { user, capture } = await startLiveFlow(request);

    await user.click(capture);
    expect(await screen.findByText('Tekan "Beli Tiket".')).toBeInTheDocument();
    expect(screen.getByTestId('target-highlight')).toHaveStyle({ left: '10.00%', top: '20.00%' });
    expect(screen.getByText(/tombol biru, atas/)).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 'Beli tiket kereta', locale: 'id', history: [] }),
      expect.anything(),
    );
    // Camera is switched off while the user reads the instruction.
    expect(stopTrack).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /sudah saya tekan/i }));
    await user.click(await screen.findByRole('button', { name: /lihat layar/i }));

    expect(await screen.findByRole('heading', { name: /berhasil/i })).toBeInTheDocument();
    expect(screen.getByText('Ambil tiket Anda.')).toBeInTheDocument();
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        history: [{ instruction: 'Tekan "Beli Tiket".', feedback: 'done' }],
      }),
      expect.anything(),
    );

    await user.click(screen.getByRole('button', { name: /selesai/i }));
    expect(await screen.findByRole('button', { name: /bantu saya sekarang/i })).toBeInTheDocument();
  });

  it('re-asks about the same photo when the user cannot find the button', async () => {
    const request = vi
      .fn<typeof requestGuidance>()
      .mockResolvedValueOnce(guidance())
      .mockResolvedValueOnce(
        guidance({ instruction: 'Cari tombol biru paling atas.', confidence: 'low' }),
      );
    const { user, capture } = await startLiveFlow(request);

    await user.click(capture);
    await user.click(await screen.findByRole('button', { name: /tidak ketemu/i }));

    expect(await screen.findByText('Cari tombol biru paling atas.')).toBeInTheDocument();
    expect(screen.getByText(/kurang yakin/i)).toBeInTheDocument();
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        history: [{ instruction: 'Tekan "Beli Tiket".', feedback: 'cant_find' }],
      }),
      expect.anything(),
    );
  });

  it('shows a safety warning and hands over to a person when the screen looks like a scam', async () => {
    const request = vi.fn<typeof requestGuidance>().mockResolvedValue(
      guidance({
        status: 'needs_human',
        target: null,
        instruction: 'Jangan lanjutkan.',
        safety: {
          level: 'stop',
          kind: 'suspicious',
          message: 'Layar ini meminta transfer ke orang asing.',
        },
      }),
    );
    const { user, capture } = await startLiveFlow(request);

    await user.click(capture);
    expect(await screen.findByRole('alert')).toHaveTextContent(/transfer ke orang asing/);
    await user.click(screen.getByRole('button', { name: /minta bantuan/i }));
    expect(await screen.findByRole('dialog', { name: /butuh bantuan/i })).toBeInTheDocument();
  });

  it('explains errors in plain language and retries', async () => {
    const request = vi
      .fn<typeof requestGuidance>()
      .mockRejectedValueOnce(new ApiError('NETWORK', 'offline'))
      .mockResolvedValueOnce(guidance());
    const { user, capture } = await startLiveFlow(request);

    await user.click(capture);
    expect(await screen.findByText(/tidak ada koneksi internet/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(await screen.findByText('Tekan "Beli Tiket".')).toBeInTheDocument();
  });

  it('asks for a better photo when the frame is unclear', async () => {
    const request = vi
      .fn<typeof requestGuidance>()
      .mockResolvedValue(
        guidance({ status: 'need_better_view', target: null, instruction: 'Dekatkan kamera.' }),
      );
    const { user, capture } = await startLiveFlow(request);

    await user.click(capture);
    await user.click(await screen.findByRole('button', { name: /foto ulang/i }));
    expect(await screen.findByRole('button', { name: /lihat layar/i })).toBeInTheDocument();
  });

  it('offers the gallery when camera permission is denied', async () => {
    mockCamera(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')));
    const request = vi.fn<typeof requestGuidance>().mockResolvedValue(guidance());
    const user = userEvent.setup();
    renderWithSettings(<App request={request} />);
    await user.click(screen.getByRole('button', { name: /bantu saya sekarang/i }));
    await user.click(await screen.findByRole('button', { name: /pesan makanan/i }));
    await user.click(screen.getByRole('button', { name: /lanjut/i }));

    expect(await screen.findByText(/izin kamera ditolak/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lihat layar/i })).toBeDisabled();

    await user.upload(
      screen.getByTestId('file-input'),
      new File(['x'], 'kiosk.jpg', { type: 'image/jpeg' }),
    );
    expect(await screen.findByText('Tekan "Beli Tiket".')).toBeInTheDocument();
  });

  it('marks demo-mode answers', async () => {
    const request = vi
      .fn<typeof requestGuidance>()
      .mockResolvedValue(guidance({ meta: { provider: 'mock', latencyMs: 5, requestId: 'r' } }));
    const { user, capture } = await startLiveFlow(request);
    await user.click(capture);
    expect(await screen.findByText(/mode demo/i)).toBeInTheDocument();
  });
});

describe('practice flow', () => {
  it('completes a scenario, correcting a wrong tap along the way', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getByRole('button', { name: /latihan dulu/i }));
    await user.click(await screen.findByRole('button', { name: /ambil nomor antrean/i }));

    await user.click(await screen.findByRole('button', { name: 'Ambil Nomor Antrean' }));
    await user.click(screen.getByRole('button', { name: 'Poli Gigi' }));
    expect(await screen.findByText(/belum tepat/i)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Poli Umum' }));
    await user.click(screen.getByRole('button', { name: 'Cetak Nomor' }));

    expect(await screen.findByRole('heading', { name: /latihan selesai/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ulangi latihan/i }));
    expect(await screen.findByText(/langkah 1 dari 3/i)).toBeInTheDocument();
  });

  it('shows the PIN safety lesson', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getByRole('button', { name: /latihan dulu/i }));
    await user.click(await screen.findByRole('button', { name: /pesan makanan/i }));
    for (const label of ['Makan di Sini', 'Nasi Ayam · Rp25.000', 'Bayar', 'Kartu Debit']) {
      await user.click(await screen.findByRole('button', { name: label }));
    }
    expect(await screen.findByRole('alert')).toHaveTextContent(/jangan pernah memberi tahu PIN/i);
  });

  it('can hide hints', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getByRole('button', { name: /latihan dulu/i }));
    await user.click(await screen.findByRole('button', { name: /beli tiket kereta/i }));
    const hint = await screen.findByRole('switch', { name: /tampilkan petunjuk/i });
    expect(hint).toBeChecked();
    await user.click(hint);
    expect(hint).not.toBeChecked();
  });

  it('supports the browser back button', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getByRole('button', { name: /latihan dulu/i }));
    expect(await screen.findByRole('heading', { name: 'Latihan' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /kembali/i }));
    expect(await screen.findByRole('button', { name: /bantu saya sekarang/i })).toBeInTheDocument();
  });
});

describe('settings', () => {
  it('switches language and text size, and persists them', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getAllByRole('button', { name: /pengaturan/i })[0]!);
    const dialog = await screen.findByRole('dialog', { name: /pengaturan/i });

    await user.click(within(dialog).getByRole('radio', { name: 'English' }));
    await user.click(within(dialog).getByRole('radio', { name: /extra large/i }));

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.textScale).toBe('xl');
    expect(JSON.parse(localStorage.getItem('tapcare.settings.v1')!)).toMatchObject({
      locale: 'en',
      textScale: 'xl',
    });
    expect(screen.getByRole('button', { name: /help me now/i })).toBeInTheDocument();
  });

  it('validates the trusted contact and offers a call link', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getAllByRole('button', { name: /pengaturan/i })[0]!);
    const dialog = await screen.findByRole('dialog', { name: /pengaturan/i });

    await user.type(within(dialog).getByLabelText('Nama'), 'Rina');
    await user.type(within(dialog).getByLabelText('Nomor telepon'), 'abc');
    await user.click(within(dialog).getByRole('button', { name: /simpan kontak/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/tidak valid/);

    await user.clear(within(dialog).getByLabelText('Nomor telepon'));
    await user.type(within(dialog).getByLabelText('Nomor telepon'), '0812-3456-7890');
    await user.click(within(dialog).getByRole('button', { name: /simpan kontak/i }));
    expect(within(dialog).getByRole('button', { name: /kontak tersimpan/i })).toBeInTheDocument();
  });

  it('opens the how-it-works sheet', async () => {
    const user = userEvent.setup();
    renderWithSettings(<App />);
    await user.click(screen.getByRole('button', { name: /bagaimana cara kerjanya/i }));
    expect(await screen.findByRole('dialog', { name: /cara kerja tapcare/i })).toHaveTextContent(
      /PIN/,
    );
  });
});
