import {
  IconChevronDown,
  IconChevronUp,
  IconDeviceFloppy,
  IconEye,
  IconInfoCircle,
  IconPencil,
  IconPlus,
  IconSend,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useMemo, useState, type FormEvent } from "react";

import { ConfirmDialog, Modal } from "@/components/app-shell/Modal";
import {
  createEmptyDayMenu,
  DAYS,
  useAppStore,
  type Day,
  type DayMenu,
  type Food,
  type FoodInput,
  type WeeklyMenu,
} from "@/lib/nutrition-store";
import {
  NUTRITION_STATUS_STYLES,
  NUTRITION_STATUSES,
  type NutritionStatus,
} from "@/lib/nutrition-status";

export function meta() {
  return [{ title: "Rekomendasi Menu - Sistem Gizi" }];
}

type Tab = "builder" | "draft" | "submitted";
type Builder = { id?: string; days: DayMenu };

const PROTEIN_ROTATION = ["food-dada-ayam", "food-telur-rebus", "food-ikan-salmon", "food-tempe-goreng"];
const VEGETABLE_ROTATION = ["food-brokoli", "food-wortel"];
const CARB_FOOD_ID = "food-nasi-putih";

const TAB_BUTTON_BASE =
  "h-8 rounded-[14px] text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#0891B2]/40 outline-none";
const TAB_BUTTON_ACTIVE = "bg-white text-[#0A0A0A] shadow-sm";
const TAB_BUTTON_IDLE = "text-[#0A0A0A]/70 hover:text-[#0A0A0A]";

const CARD_CLASS = "flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-6";
const OUTLINE_BUTTON =
  "flex h-9 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] hover:bg-black/5";
const PRIMARY_BUTTON =
  "flex h-9 items-center gap-2 rounded-lg bg-[#0891B2] px-4 text-sm text-white hover:bg-[#0E7490]";
const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm text-[#0A0A0A] outline-none placeholder:text-[#B3B3B3] focus:border-[#0891B2]";

const round1 = (value: number) => Math.round(value * 10) / 10;

const formatMacros = (food: Food) =>
  `${food.calories} kal • P: ${round1(food.protein)}g • K: ${round1(food.carbs)}g • L: ${round1(food.fat)}g`;

const sumNutrition = (foodIds: string[], foodsById: Map<string, Food>) =>
  foodIds.reduce(
    (total, id) => {
      const food = foodsById.get(id);
      if (!food) return total;
      return {
        calories: total.calories + food.calories,
        protein: total.protein + food.protein,
        carbs: total.carbs + food.carbs,
        fat: total.fat + food.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

const generateWeeklyMenu = (): DayMenu => {
  const days = createEmptyDayMenu();
  DAYS.forEach((day, index) => {
    days[day] = [
      PROTEIN_ROTATION[index % PROTEIN_ROTATION.length],
      CARB_FOOD_ID,
      VEGETABLE_ROTATION[index % VEGETABLE_ROTATION.length],
    ];
  });
  return days;
};

const cloneDays = (days: DayMenu): DayMenu =>
  DAYS.reduce((copy, day) => ({ ...copy, [day]: [...days[day]] }), createEmptyDayMenu());

function NutritionSummary({ label, foodIds, foodsById }: { label: string; foodIds: string[]; foodsById: Map<string, Food> }) {
  const totals = sumNutrition(foodIds, foodsById);
  const items = [
    { name: "Kalori", value: `${Math.round(totals.calories)} kal` },
    { name: "Protein", value: `${round1(totals.protein)}g` },
    { name: "Karbo", value: `${round1(totals.carbs)}g` },
    { name: "Lemak", value: `${round1(totals.fat)}g` },
  ];
  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-[#EFF6FF] p-3">
      <span className="text-sm text-[#0A0A0A]">{label}</span>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#4A5565]">
        {items.map((item) => (
          <span key={item.name}>
            {item.name}: <span className="text-[#0A0A0A]">{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DayFoodList({
  foodIds,
  foodsById,
  onRemove,
}: {
  foodIds: string[];
  foodsById: Map<string, Food>;
  onRemove?: (index: number) => void;
}) {
  if (foodIds.length === 0) {
    return <p className="text-sm text-[#717182]">Belum ada bahan makanan untuk hari ini.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {foodIds.map((id, index) => {
        const food = foodsById.get(id);
        if (!food) return null;
        return (
          <li
            key={`${id}-${index}`}
            className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F9FAFB] px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-base text-[#0A0A0A]">{food.name}</span>
              <span className="text-xs text-[#4A5565]">{formatMacros(food)}</span>
            </div>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Hapus ${food.name}`}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-black/5"
              >
                <IconX size={16} stroke={1.33} color="#0A0A0A" />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function DayTabs({ selected, onSelect }: { selected: Day; onSelect: (day: Day) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-5 rounded-[14px] bg-[#ECECF0] p-1">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          role="tab"
          aria-selected={selected === day}
          onClick={() => onSelect(day)}
          className={`${TAB_BUTTON_BASE} ${selected === day ? TAB_BUTTON_ACTIVE : TAB_BUTTON_IDLE}`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

function AddFoodDialog({ day, onAddFood, onClose }: { day: Day; onAddFood: (foodId: string) => void; onClose: () => void }) {
  const foods = useAppStore((state) => state.foods);
  const addFood = useAppStore((state) => state.addFood);
  const notify = useAppStore((state) => state.notify);
  const [existingId, setExistingId] = useState("");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (existingId) {
      onAddFood(existingId);
      notify("Notification", `Bahan ditambahkan ke menu ${day}`);
      return;
    }
    const values = [calories, protein, carbs, fat].map(Number);
    if (!name.trim()) {
      setError("Nama makanan wajib diisi.");
      return;
    }
    if ([calories, protein, carbs, fat].some((value) => value.trim() === "") || values.some((value) => Number.isNaN(value) || value < 0)) {
      setError("Kalori, protein, karbo, dan lemak harus berupa angka.");
      return;
    }
    const input: FoodInput = {
      name: name.trim(),
      calories: values[0],
      protein: values[1],
      carbs: values[2],
      fat: values[3],
    };
    const food = addFood(input);
    onAddFood(food.id);
    notify("Notification", `Bahan baru "${food.name}" ditambahkan ke menu ${day}`);
  };

  return (
    <Modal title="Tambah Bahan" description={`Tambahkan bahan makanan ke menu hari ${day}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#1E1E1E]">Pilih dari database</span>
          <select className={INPUT_CLASS} value={existingId} onChange={(event) => setExistingId(event.target.value)}>
            <option value="">Tidak memilih (buat bahan baru)</option>
            {foods.map((food) => (
              <option key={food.id} value={food.id}>
                {food.name} ({food.calories} kal)
              </option>
            ))}
          </select>
        </label>

        <fieldset disabled={Boolean(existingId)} className="grid grid-cols-1 gap-4 disabled:opacity-50 sm:grid-cols-2">
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-xs font-bold text-[#1E1E1E]">Nama makanan</span>
            <input className={INPUT_CLASS} value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama makanan" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#1E1E1E]">Kalori</span>
            <input className={INPUT_CLASS} type="number" min="0" value={calories} onChange={(event) => setCalories(event.target.value)} placeholder="Masukkan jumlah kalori" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#1E1E1E]">Protein (g)</span>
            <input className={INPUT_CLASS} type="number" min="0" step="0.1" value={protein} onChange={(event) => setProtein(event.target.value)} placeholder="Masukkan jumlah protein" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#1E1E1E]">Karbo (g)</span>
            <input className={INPUT_CLASS} type="number" min="0" step="0.1" value={carbs} onChange={(event) => setCarbs(event.target.value)} placeholder="Masukkan jumlah karbohidrat" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#1E1E1E]">Lemak (g)</span>
            <input className={INPUT_CLASS} type="number" min="0" step="0.1" value={fat} onChange={(event) => setFat(event.target.value)} placeholder="Masukkan jumlah lemak" />
          </label>
        </fieldset>

        {error ? <p className="text-sm text-[#E7000B]">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-black/10 bg-white px-4 text-sm text-[#0A0A0A] hover:bg-black/5">
            Batal
          </button>
          <button type="submit" className="h-9 rounded-lg bg-[#0891B2] px-4 text-sm text-white hover:bg-[#0E7490]">
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function RekomendasiMenuRoute() {
  const foods = useAppStore((state) => state.foods);
  const menus = useAppStore((state) => state.menus);
  const kids = useAppStore((state) => state.kids);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const submitMenu = useAppStore((state) => state.submitMenu);
  const deleteMenu = useAppStore((state) => state.deleteMenu);
  const notify = useAppStore((state) => state.notify);

  const [tab, setTab] = useState<Tab>("builder");
  const [autoOpen, setAutoOpen] = useState(true);
  const [builder, setBuilder] = useState<Builder>({ days: createEmptyDayMenu() });
  const [selectedDay, setSelectedDay] = useState<Day>("Senin");
  const [showAddFood, setShowAddFood] = useState(false);
  const [viewingMenuId, setViewingMenuId] = useState<string | null>(null);
  const [viewDay, setViewDay] = useState<Day>("Senin");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const foodsById = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);
  const drafts = menus.filter((menu) => menu.status === "draft");
  const submitted = menus.filter((menu) => menu.status === "submitted");
  const viewingMenu: WeeklyMenu | undefined = menus.find((menu) => menu.id === viewingMenuId);
  const pendingDelete = menus.find((menu) => menu.id === pendingDeleteId);

  const distribution = useMemo(
    () =>
      NUTRITION_STATUSES.map((status: NutritionStatus) => {
        const count = kids.filter((kid) => kid.status === status).length;
        return { status, count, percent: kids.length ? Math.round((count / kids.length) * 100) : 0 };
      }),
    [kids],
  );

  const openDraftForEdit = (menu: WeeklyMenu) => {
    setBuilder({ id: menu.id, days: cloneDays(menu.days) });
    setSelectedDay("Senin");
    setTab("builder");
  };

  const handleGenerate = () => {
    setBuilder((current) => ({ ...current, days: generateWeeklyMenu() }));
    notify("Notification", "Menu mingguan berhasil di-generate");
  };

  const handleSaveDraft = () => {
    const id = saveDraft({ id: builder.id, days: builder.days });
    setBuilder((current) => ({ ...current, id }));
    notify("Notification", "Draft menu berhasil disimpan");
  };

  const handleRemoveFood = (index: number) => {
    setBuilder((current) => ({
      ...current,
      days: { ...current.days, [selectedDay]: current.days[selectedDay].filter((_, i) => i !== index) },
    }));
  };

  const handleAddFoodToDay = (foodId: string) => {
    setBuilder((current) => ({
      ...current,
      days: { ...current.days, [selectedDay]: [...current.days[selectedDay], foodId] },
    }));
    setShowAddFood(false);
  };

  const handleSubmitDraft = (menu: WeeklyMenu) => {
    submitMenu(menu.id);
    if (builder.id === menu.id) setBuilder({ days: createEmptyDayMenu() });
  };

  const tabs: { value: Tab; label: string }[] = [
    { value: "builder", label: "Builder Menu" },
    { value: "draft", label: `Draft (${drafts.length})` },
    { value: "submitted", label: `Submitted (${submitted.length})` },
  ];

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl text-[#0A0A0A]">Rekomendasi Menu</h1>
        <p className="text-base text-[#4A5565]">Buat rekomendasi menu mingguan berdasarkan kebutuhan nutrisi anak</p>
      </div>

      <div role="tablist" className="grid grid-cols-3 rounded-[14px] bg-[#ECECF0] p-1">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={`${TAB_BUTTON_BASE} ${tab === item.value ? TAB_BUTTON_ACTIVE : TAB_BUTTON_IDLE}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "builder" ? (
        <>
          <section className={CARD_CLASS}>
            <button
              type="button"
              onClick={() => setAutoOpen((value) => !value)}
              aria-expanded={autoOpen}
              className="flex items-start justify-between gap-4 text-left"
            >
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-base text-[#0A0A0A]">
                  <IconSparkles size={20} stroke={1.67} color="#B45309" />
                  Auto-Generate Menu Berdasarkan Status Gizi
                </span>
                <span className="text-base text-[#717182]">
                  Sistem akan menganalisis distribusi status gizi anak dan menghasilkan rekomendasi menu secara otomatis
                </span>
              </div>
              {autoOpen ? <IconChevronUp size={20} stroke={1.67} /> : <IconChevronDown size={20} stroke={1.67} />}
            </button>

            {autoOpen ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <span className="text-base font-bold text-[#0A0A0A]">Distribusi Status Gizi Anak</span>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {distribution.map(({ status, count, percent }) => (
                      <div
                        key={status}
                        className={`flex flex-col gap-1 rounded-[10px] border p-3 ${NUTRITION_STATUS_STYLES[status].card}`}
                      >
                        <span className="text-xs text-[#4A5565]">{status}</span>
                        <span className="text-base font-bold text-[#0A0A0A]">
                          {count} <span className="text-xs font-normal text-[#4A5565]">({percent}%)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={handleGenerate} className={`${PRIMARY_BUTTON} self-start`}>
                    <IconSparkles size={16} stroke={1.67} />
                    Generate Menu
                  </button>
                </div>
                <div className="flex gap-3 rounded-[10px] border border-[#BEDBFF] bg-[#EFF6FF] p-4 text-sm text-[#193CB8]">
                  <IconInfoCircle size={18} stroke={1.67} color="#193CB8" className="mt-0.5 shrink-0" />
                  <p>
                    <span className="font-bold">Catatan: </span>
                    Menu yang di-generate dapat Anda edit secara manual di Builder Menu Mingguan. Sistem otomatis akan menghindari bahan makanan dengan alergen yang tingkat keparahannya severe atau moderate.
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section className={CARD_CLASS}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base text-[#0A0A0A]">Builder Menu Mingguan</h2>
                <p className="text-base text-[#717182]">Susun menu untuk setiap hari dengan memilih bahan makanan dari database</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowAddFood(true)} className={OUTLINE_BUTTON}>
                  <IconPlus size={16} stroke={1.67} />
                  Tambah Bahan
                </button>
                <button type="button" onClick={handleSaveDraft} className={PRIMARY_BUTTON}>
                  <IconDeviceFloppy size={16} stroke={1.67} />
                  Simpan sebagai Draft
                </button>
              </div>
            </div>

            <DayTabs selected={selectedDay} onSelect={setSelectedDay} />

            <DayFoodList
              foodIds={builder.days[selectedDay]}
              foodsById={foodsById}
              onRemove={handleRemoveFood}
            />

            <NutritionSummary
              label={`Total Nutrisi ${selectedDay}:`}
              foodIds={builder.days[selectedDay]}
              foodsById={foodsById}
            />
          </section>
        </>
      ) : null}

      {tab === "draft" ? (
        <section className="flex flex-col gap-4">
          {drafts.length === 0 ? (
            <div className={`${CARD_CLASS} items-center text-center text-[#717182]`}>Belum ada draft menu.</div>
          ) : null}
          {drafts.map((menu) => (
            <article key={menu.id} className="flex flex-col gap-4 rounded-[14px] border-2 border-black/10 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[#0A0A0A]">{menu.title}</h3>
                  <span className="rounded-lg border border-black/10 px-2 py-0.5 text-xs">draft</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openDraftForEdit(menu)} className={OUTLINE_BUTTON}>
                    <IconPencil size={16} stroke={1.33} />
                    Edit
                  </button>
                  <button type="button" onClick={() => handleSubmitDraft(menu)} className={OUTLINE_BUTTON}>
                    <IconSend size={16} stroke={1.33} />
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(menu.id)}
                    aria-label={`Hapus ${menu.title}`}
                    className="flex size-9 items-center justify-center rounded-lg bg-[#D4183D] hover:bg-[#B5132F]"
                  >
                    <IconTrash size={16} stroke={1.33} color="white" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 text-sm text-[#4A5565]">
                <span>Dibuat oleh: {menu.createdBy}</span>
                <span>Waktu: {menu.createdAt}</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "submitted" ? (
        <section className="flex flex-col gap-4">
          {submitted.length === 0 ? (
            <div className={`${CARD_CLASS} items-center text-center text-[#717182]`}>Belum ada menu yang disubmit.</div>
          ) : null}
          {submitted.map((menu) => (
            <article key={menu.id} className="flex flex-col gap-4 rounded-[14px] border-2 border-[#FFF085] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[#0A0A0A]">{menu.title}</h3>
                  <span className="rounded-lg bg-[#ECEEF2] px-2 py-0.5 text-xs text-[#030213]">submitted</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewDay("Senin");
                    setViewingMenuId(menu.id);
                  }}
                  className={OUTLINE_BUTTON}
                >
                  <IconEye size={16} stroke={1.33} />
                  Lihat
                </button>
              </div>
              <div className="flex flex-wrap gap-x-6 text-sm text-[#4A5565]">
                <span>Disubmit oleh: {menu.createdBy}</span>
                <span>Waktu: {menu.createdAt}</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {showAddFood ? (
        <AddFoodDialog day={selectedDay} onAddFood={handleAddFoodToDay} onClose={() => setShowAddFood(false)} />
      ) : null}

      {viewingMenu ? (
        <Modal
          title="Menu Mingguan"
          description={`${viewingMenu.title} • Dibuat oleh ${viewingMenu.createdBy}`}
          widthClass="max-w-[760px]"
          onClose={() => setViewingMenuId(null)}
        >
          <div className="flex flex-col gap-4">
            <DayTabs selected={viewDay} onSelect={setViewDay} />
            <DayFoodList foodIds={viewingMenu.days[viewDay]} foodsById={foodsById} />
            <NutritionSummary
              label={`Total Nutrisi ${viewDay}:`}
              foodIds={viewingMenu.days[viewDay]}
              foodsById={foodsById}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingMenuId(null)}
                className="h-9 rounded-lg border border-black/10 bg-white px-4 text-sm text-[#0A0A0A] hover:bg-black/5"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Konfirmasi Hapus"
          message="Apakah Anda yakin ingin hapus data ini?"
          confirmLabel="Hapus"
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => {
            deleteMenu(pendingDelete.id);
            if (builder.id === pendingDelete.id) setBuilder({ days: createEmptyDayMenu() });
            notify("Notification", "Draft menu berhasil dihapus");
            setPendingDeleteId(null);
          }}
        />
      ) : null}
    </>
  );
}
