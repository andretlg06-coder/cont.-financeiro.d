/*
 * Direção visual: Estúdio Operacional Azul-Índigo.
 * Este módulo combina hierarquia Swiss, navegação lateral persistente e dados financeiros tratados em centavos.
 * A experiência prioriza clareza, confiança visual e feedback imediato após cada ação.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FileJson,
  Filter,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react";

type TransactionType = "income" | "expense";
type PaymentMethod = "pix" | "debit" | "credit" | "cash" | "transfer";
type Section = "overview" | "transactions" | "categories" | "goals" | "reports";

type Transaction = {
  id: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  note?: string;
};

type Goal = {
  id: string;
  name: string;
  targetCents: number;
  savedCents: number;
  deadline: string;
  color: string;
};

type FinanceStore = {
  version: 1;
  transactions: Transaction[];
  goals: Goal[];
};

type TransactionForm = {
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  note: string;
};

type GoalForm = {
  name: string;
  target: string;
  saved: string;
  deadline: string;
  color: string;
};

const STORAGE_KEY = "saldo-financeiro-store-v1";
const CURRENCY = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const SHORT_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const LONG_DATE = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  transfer: "Transferência",
};
const CATEGORY_COLORS: Record<string, string> = {
  Moradia: "#243B6B",
  Alimentação: "#D98B35",
  Transporte: "#5C8D7B",
  Lazer: "#906A87",
  Saúde: "#B64D4D",
  Educação: "#47769A",
  Salário: "#2F7658",
  Freelance: "#B07A32",
  Outros: "#7B8794",
};
const DEFAULT_CATEGORIES = ["Moradia", "Alimentação", "Transporte", "Lazer", "Saúde", "Educação", "Outros"];
const GOAL_COLORS = ["#243B6B", "#5C8D7B", "#D98B35", "#906A87"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function formatCurrency(cents: number) {
  return CURRENCY.format(cents / 100);
}

function parseMoneyToCents(value: string) {
  const normalized = value.trim().replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".");
  if (!normalized || !/^\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, decimal = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
}

function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateFromMonth(month: string, day: number) {
  const safeDay = String(Math.min(day, 28)).padStart(2, "0");
  return `${month}-${safeDay}`;
}

function demoStore(): FinanceStore {
  const currentMonth = monthKey(todayISO());
  const previousDate = new Date();
  previousDate.setMonth(previousDate.getMonth() - 1);
  const previousMonth = monthKey(previousDate.toISOString().slice(0, 10));
  return {
    version: 1,
    transactions: [
      { id: "demo-salary", description: "Salário mensal", amountCents: 780000, type: "income", category: "Salário", date: dateFromMonth(currentMonth, 5), paymentMethod: "transfer", note: "Entrada principal" },
      { id: "demo-rent", description: "Aluguel e condomínio", amountCents: 215000, type: "expense", category: "Moradia", date: dateFromMonth(currentMonth, 6), paymentMethod: "transfer" },
      { id: "demo-market", description: "Mercado da semana", amountCents: 38640, type: "expense", category: "Alimentação", date: dateFromMonth(currentMonth, 12), paymentMethod: "debit" },
      { id: "demo-freela", description: "Projeto pontual", amountCents: 165000, type: "income", category: "Freelance", date: dateFromMonth(previousMonth, 18), paymentMethod: "pix" },
      { id: "demo-transport", description: "Transporte e combustível", amountCents: 22400, type: "expense", category: "Transporte", date: dateFromMonth(previousMonth, 14), paymentMethod: "credit" },
      { id: "demo-leisure", description: "Cinema e jantar", amountCents: 9400, type: "expense", category: "Lazer", date: dateFromMonth(previousMonth, 22), paymentMethod: "credit" },
    ],
    goals: [
      { id: "goal-reserve", name: "Reserva de emergência", targetCents: 1200000, savedCents: 690000, deadline: `${new Date().getFullYear()}-12-20`, color: "#243B6B" },
      { id: "goal-trip", name: "Viagem de fim de ano", targetCents: 450000, savedCents: 218000, deadline: `${new Date().getFullYear()}-11-30`, color: "#D98B35" },
    ],
  };
}

function loadStore(): FinanceStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoStore();
    const parsed = JSON.parse(raw) as FinanceStore;
    if (parsed.version !== 1 || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.goals)) return demoStore();
    return parsed;
  } catch {
    return demoStore();
  }
}

function getMonthLabel(month: string) {
  const date = new Date(`${month}-01T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

function getMonthLabelShort(month: string) {
  const date = new Date(`${month}-01T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
}

function getLastMonths(count: number) {
  const months: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(cursor);
    date.setMonth(cursor.getMonth() - i);
    months.push(date.toISOString().slice(0, 7));
  }
  return months;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><ReceiptText size={20} /></div>
      <div>
        <strong>Nenhum lançamento neste recorte</strong>
        <p>Registre uma entrada ou saída para começar a acompanhar seu mês.</p>
      </div>
      <button className="button button-secondary" onClick={onAdd}><Plus size={16} /> Novo lançamento</button>
    </div>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="mark-bar mark-bar-tall" />
      <span className="mark-bar mark-bar-short" />
      <span className="mark-base" />
    </span>
  );
}

function AppShell({
  activeSection,
  onSectionChange,
  children,
}: {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems: Array<{ key: Section; label: string; icon: typeof LayoutDashboard }> = [
    { key: "overview", label: "Visão geral", icon: LayoutDashboard },
    { key: "transactions", label: "Lançamentos", icon: ReceiptText },
    { key: "categories", label: "Categorias", icon: BarChart3 },
    { key: "goals", label: "Metas", icon: Target },
    { key: "reports", label: "Relatórios", icon: TrendingUp },
  ];

  const navigate = (section: Section) => {
    onSectionChange(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <BrandMark />
          <div><span className="brand-name">saldo<span>.</span></span><span className="brand-caption">controle financeiro</span></div>
        </div>
        <div className="workspace-label">ESPAÇO PESSOAL <span>01</span></div>
        <nav className="primary-nav" aria-label="Navegação principal">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={`nav-item ${activeSection === key ? "nav-item-active" : ""}`} onClick={() => navigate(key)}>
              <Icon size={17} strokeWidth={activeSection === key ? 2.2 : 1.8} /><span>{label}</span>
              {key === "transactions" && <span className="nav-count">+</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-note">
          <div className="note-mark"><Check size={14} /></div>
          <div><strong>Incremento 5 de 5</strong><span>Base local pronta para crescer.</span></div>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => toast.info("Configurações locais em breve.")}><Settings2 size={17} /><span>Configurações</span></button>
          <button className="nav-item" onClick={() => toast.info("Dicas: lance primeiro, analise depois.")}><CircleHelp size={17} /><span>Ajuda rápida</span></button>
          <div className="profile-row"><div className="avatar">AM</div><div><strong>Minha conta</strong><span>Dados neste dispositivo</span></div><MoreHorizontal size={16} className="profile-more" /></div>
        </div>
      </aside>
      {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-canvas">
        <header className="topbar">
          <button className="mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
          <div className="topbar-brand"><BrandMark /><span>saldo<span>.</span></span></div><div className="breadcrumb"><span>Espaço pessoal</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.key === activeSection)?.label}</strong></div>
          <div className="topbar-actions">
            <span className="privacy-pill"><span className="privacy-dot" /> somente local</span>
            <button className="icon-button" aria-label="Buscar" onClick={() => toast.info("Use os filtros da página para encontrar lançamentos.")}><Search size={18} /></button>
            <button className="avatar avatar-small" aria-label="Perfil">AM</button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function StatCard({ label, value, helper, tone, icon: Icon, trend }: { label: string; value: string; helper: string; tone: "indigo" | "green" | "amber" | "red"; icon: typeof WalletCards; trend?: "up" | "down" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-card-top"><span className="eyebrow">{label}</span><span className="stat-icon"><Icon size={17} /></span></div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-helper">{trend && (trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}<span>{helper}</span></div>
    </article>
  );
}

function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const shiftMonth = (amount: number) => {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + amount);
    onChange(date.toISOString().slice(0, 7));
  };
  return (
    <div className="month-switcher">
      <button className="icon-button icon-button-quiet" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
      <div className="month-current"><CalendarDays size={15} /><span>{getMonthLabel(month)}</span></div>
      <button className="icon-button icon-button-quiet" aria-label="Próximo mês" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
    </div>
  );
}

function CashflowChart({ transactions }: { transactions: Transaction[] }) {
  const months = getLastMonths(6);
  const data = months.map((month) => {
    const monthTransactions = transactions.filter((item) => monthKey(item.date) === month);
    const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
    const expense = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
    return { month, income, expense, total: Math.max(income, expense, 1) };
  });
  const maxValue = Math.max(...data.map((item) => item.total), 1);
  return (
    <div className="chart-wrap">
      <div className="chart-legend"><span><i className="legend-dot legend-income" />Entradas</span><span><i className="legend-dot legend-expense" />Saídas</span><span className="chart-scale">valores em R$</span></div>
      <div className="chart-grid-lines"><span /><span /><span /><span /></div>
      <div className="bars" aria-label="Comparativo de entradas e saídas nos últimos seis meses">
        {data.map((item) => (
          <div className="bar-group" key={item.month}>
            <div className="bar-pair">
              <div className="bar bar-income" style={{ height: `${Math.max((item.income / maxValue) * 100, item.income ? 5 : 1)}%` }} title={`Entradas: ${formatCurrency(item.income)}`} />
              <div className="bar bar-expense" style={{ height: `${Math.max((item.expense / maxValue) * 100, item.expense ? 5 : 1)}%` }} title={`Saídas: ${formatCurrency(item.expense)}`} />
            </div>
            <span>{getMonthLabelShort(item.month)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionRow({ transaction, onEdit, onDelete }: { transaction: Transaction; onEdit: () => void; onDelete: () => void }) {
  const isIncome = transaction.type === "income";
  return (
    <div className="transaction-row">
      <div className={`transaction-symbol ${isIncome ? "symbol-income" : "symbol-expense"}`}>{isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div>
      <div className="transaction-main"><strong>{transaction.description}</strong><span>{transaction.category} <b>·</b> {PAYMENT_LABELS[transaction.paymentMethod]}</span></div>
      <span className="transaction-date">{SHORT_DATE.format(new Date(`${transaction.date}T12:00:00`))}</span>
      <strong className={`transaction-amount ${isIncome ? "amount-income" : "amount-expense"}`}>{isIncome ? "+" : "−"} {formatCurrency(transaction.amountCents)}</strong>
      <div className="row-actions"><button className="icon-button icon-button-quiet" aria-label={`Editar ${transaction.description}`} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button icon-button-quiet danger-hover" aria-label={`Excluir ${transaction.description}`} onClick={onDelete}><Trash2 size={15} /></button></div>
    </div>
  );
}

function TransactionModal({
  initial,
  categories,
  onClose,
  onSave,
}: {
  initial: Transaction | null;
  categories: string[];
  onClose: () => void;
  onSave: (form: TransactionForm) => void;
}) {
  const [form, setForm] = useState<TransactionForm>(() => initial ? { description: initial.description, amount: centsToInput(initial.amountCents), type: initial.type, category: initial.category, date: initial.date, paymentMethod: initial.paymentMethod, note: initial.note ?? "" } : { description: "", amount: "", type: "expense", category: categories[0] ?? "Outros", date: todayISO(), paymentMethod: "pix", note: "" });
  const [error, setError] = useState("");
  const update = <K extends keyof TransactionForm>(key: K, value: TransactionForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cents = parseMoneyToCents(form.amount);
    if (!form.description.trim()) return setError("Informe uma descrição para o lançamento.");
    if (cents === null || cents <= 0) return setError("Informe um valor válido maior que zero. Ex.: 125,90");
    if (!form.date) return setError("Informe a data do lançamento.");
    setError("");
    onSave(form);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title">
        <div className="modal-header"><div><span className="eyebrow">{initial ? "Editar registro" : "Novo registro"}</span><h2 id="transaction-modal-title">{initial ? "Ajustar lançamento" : "Registrar lançamento"}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={submit}>
          <div className="segmented-control"><button type="button" className={form.type === "expense" ? "segment-active segment-expense" : ""} onClick={() => update("type", "expense")}><ArrowUpRight size={15} /> Saída</button><button type="button" className={form.type === "income" ? "segment-active segment-income" : ""} onClick={() => update("type", "income")}><ArrowDownLeft size={15} /> Entrada</button></div>
          <div className="form-grid"><label className="field field-wide"><span>Descrição</span><input autoFocus value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Ex.: Conta de energia" /></label><label className="field"><span>Valor <small>em reais</small></span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0,00" /></div></label><label className="field"><span>Data</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} /></label><label className="field"><span>Categoria</span><div className="select-wrap"><select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={15} /></div></label><label className="field"><span>Pagamento</span><div className="select-wrap"><select value={form.paymentMethod} onChange={(event) => update("paymentMethod", event.target.value as PaymentMethod)}>{Object.entries(PAYMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={15} /></div></label><label className="field field-wide"><span>Nota <small>opcional</small></span><input value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Adicione um contexto curto" /></label></div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer"><span className="form-hint"><WalletCards size={14} /> salvo neste dispositivo</span><div className="modal-buttons"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary"><Check size={15} /> {initial ? "Salvar alterações" : "Adicionar lançamento"}</button></div></div>
        </form>
      </section>
    </div>
  );
}

function GoalModal({ initial, onClose, onSave }: { initial: Goal | null; onClose: () => void; onSave: (form: GoalForm) => void }) {
  const [form, setForm] = useState<GoalForm>(() => initial ? { name: initial.name, target: centsToInput(initial.targetCents), saved: centsToInput(initial.savedCents), deadline: initial.deadline, color: initial.color } : { name: "", target: "", saved: "0,00", deadline: `${new Date().getFullYear()}-12-31`, color: GOAL_COLORS[0] });
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const target = parseMoneyToCents(form.target);
    const saved = parseMoneyToCents(form.saved);
    if (!form.name.trim()) return setError("Dê um nome para a sua meta.");
    if (target === null || target <= 0) return setError("Informe um valor-alvo válido.");
    if (saved === null || saved < 0 || saved > target) return setError("O valor guardado deve estar entre zero e o valor-alvo.");
    setError("");
    onSave(form);
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card modal-card-small" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
        <div className="modal-header"><div><span className="eyebrow">Planejamento</span><h2 id="goal-modal-title">{initial ? "Editar meta" : "Nova meta"}</h2></div><button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={submit}><div className="form-grid"><label className="field field-wide"><span>Nome da meta</span><input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Fundo de segurança" /></label><label className="field"><span>Valor-alvo</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} placeholder="0,00" /></div></label><label className="field"><span>Já guardado</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.saved} onChange={(event) => setForm({ ...form, saved: event.target.value })} placeholder="0,00" /></div></label><label className="field"><span>Data limite</span><input type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label><div className="field"><span>Cor de identificação</span><div className="color-options">{GOAL_COLORS.map((color) => <button type="button" key={color} className={`color-option ${form.color === color ? "color-option-active" : ""}`} style={{ backgroundColor: color }} aria-label={`Selecionar cor ${color}`} onClick={() => setForm({ ...form, color })}>{form.color === color && <Check size={13} />}</button>)}</div></div></div>{error && <div className="form-error">{error}</div>}<div className="modal-footer"><span className="form-hint"><Target size={14} /> transforme planos em marcos</span><div className="modal-buttons"><button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button><button type="submit" className="button button-primary"><Check size={15} /> Salvar meta</button></div></div></form>
      </section>
    </div>
  );
}

function Overview({ transactions, month, onMonthChange, onAdd, onEdit, onDelete, onNavigate, goals }: { transactions: Transaction[]; month: string; onMonthChange: (month: string) => void; onAdd: () => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void; onNavigate: (section: Section) => void; goals: Goal[] }) {
  const monthTransactions = useMemo(() => transactions.filter((item) => monthKey(item.date) === month), [transactions, month]);
  const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
  const expense = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
  const recent = [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const allIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
  const allExpense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
  const maxGoal = goals.length ? Math.max(...goals.map((goal) => goal.targetCents)) : 1;
  return (
    <div className="page-content">
      <section className="page-heading"><div><div className="section-kicker"><span className="kicker-line" /><span className="kicker-mark"><span /><span /><i /></span> PAINEL DE CONTROLE <span className="kicker-number">01</span></div><h1>Seu mês sob controle.</h1><p>Uma leitura rápida das suas entradas, saídas e próximos marcos.</p></div><div className="heading-tools"><MonthSwitcher month={month} onChange={onMonthChange} /><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Novo lançamento</button></div></section>
      <section className="stats-grid"><StatCard label="Saldo do mês" value={formatCurrency(balance)} helper={balance >= 0 ? "resultado positivo" : "atenção ao resultado"} tone={balance >= 0 ? "indigo" : "red"} icon={WalletCards} /><StatCard label="Entradas" value={formatCurrency(income)} helper={`${monthTransactions.filter((item) => item.type === "income").length} lançamentos no mês`} tone="green" icon={ArrowDownLeft} trend="up" /><StatCard label="Saídas" value={formatCurrency(expense)} helper={`${monthTransactions.filter((item) => item.type === "expense").length} lançamentos no mês`} tone="amber" icon={ArrowUpRight} trend="down" /><StatCard label="Taxa de economia" value={`${Math.max(savingsRate, 0)}%`} helper={income > 0 ? "das entradas preservadas" : "registre uma entrada"} tone="indigo" icon={TrendingUp} /></section>
      <section className="dashboard-grid"><article className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">FLUXO DE CAIXA</span><h2>Entradas e saídas</h2></div><button className="text-button" onClick={() => onNavigate("reports")}>Ver relatório <ChevronRight size={15} /></button></div><CashflowChart transactions={transactions} /></article><article className="panel balance-panel"><div className="panel-heading"><div><span className="eyebrow">RESUMO DO PERÍODO</span><h2>Destino do dinheiro</h2></div><span className="panel-index">{month.slice(5)}/{month.slice(0, 4)}</span></div><div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(#243B6B 0 46%, #D98B35 46% 74%, #5C8D7B 74% 86%, #E7E9EE 86% 100%)` }}><div className="donut-center"><strong>{formatCurrency(Math.max(balance, 0))}</strong><span>livre</span></div></div><div className="donut-legend"><span><i style={{ backgroundColor: "#243B6B" }} />Custos fixos <b>{formatCurrency(Math.round(expense * 0.58))}</b></span><span><i style={{ backgroundColor: "#D98B35" }} />Variáveis <b>{formatCurrency(Math.round(expense * 0.36))}</b></span><span><i style={{ backgroundColor: "#5C8D7B" }} />Metas <b>{formatCurrency(Math.round(Math.max(balance, 0) * 0.2))}</b></span></div></div><div className="balance-foot"><span>Acumulado em todos os registros</span><strong>{formatCurrency(allIncome - allExpense)}</strong></div></article></section>
      <section className="bottom-grid"><article className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">MOVIMENTAÇÕES</span><h2>Atividade recente</h2></div><button className="text-button" onClick={() => onNavigate("transactions")}>Ver todos <ChevronRight size={15} /></button></div>{recent.length ? <div className="transaction-list">{recent.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onEdit={() => onEdit(transaction)} onDelete={() => onDelete(transaction)} />)}</div> : <EmptyState onAdd={onAdd} />}</article><article className="panel goals-panel"><div className="panel-heading"><div><span className="eyebrow">PLANEJAMENTO</span><h2>Metas em curso</h2></div><button className="text-button" onClick={() => onNavigate("goals")}>Gerenciar <ChevronRight size={15} /></button></div><div className="goals-list">{goals.slice(0, 3).map((goal) => { const progress = Math.min(Math.round((goal.savedCents / goal.targetCents) * 100), 100); return <div className="goal-row" key={goal.id}><div className="goal-icon" style={{ color: goal.color, backgroundColor: `${goal.color}14` }}><Target size={17} /></div><div className="goal-info"><div><strong>{goal.name}</strong><span>{progress}% concluído</span></div><div className="progress-track"><span style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div><small>{formatCurrency(goal.savedCents)} de {formatCurrency(goal.targetCents)}</small></div></div>; })}</div><div className="goals-callout"><span>próximo marco</span><strong>{goals.length ? formatCurrency(Math.max(goals[0].targetCents - goals[0].savedCents, 0)) : "R$ 0,00"}</strong><small>para sua primeira meta</small></div></article></section>
      <div className="data-note"><FileJson size={14} /><span>Dados salvos no seu navegador. Não enviamos informações para servidores.</span><button onClick={() => onNavigate("reports")}>Exportar ou importar <ChevronRight size={14} /></button></div>
    </div>
  );
}

function TransactionsView({ transactions, month, onMonthChange, onAdd, onEdit, onDelete }: { transactions: Transaction[]; month: string; onMonthChange: (month: string) => void; onAdd: () => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void }) {
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const categories = Array.from(new Set(transactions.map((item) => item.category))).sort();
  const filtered = transactions.filter((item) => monthKey(item.date) === month && (filter === "all" || item.type === filter) && (category === "all" || item.category === category) && item.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const total = filtered.reduce((sum, item) => sum + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
  return <div className="page-content"><section className="page-heading"><div><div className="section-kicker"><span className="kicker-line" /> REGISTROS <span className="kicker-number">02</span></div><h1>Todos os lançamentos.</h1><p>Edite, filtre e mantenha cada movimento no seu lugar.</p></div><div className="heading-tools"><MonthSwitcher month={month} onChange={onMonthChange} /><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Novo lançamento</button></div></section><section className="panel filters-panel"><div className="filter-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar lançamento" /></div><div className="filter-divider" /><div className="filter-tabs"><button className={filter === "all" ? "filter-active" : ""} onClick={() => setFilter("all")}>Todos</button><button className={filter === "income" ? "filter-active" : ""} onClick={() => setFilter("income")}>Entradas</button><button className={filter === "expense" ? "filter-active" : ""} onClick={() => setFilter("expense")}>Saídas</button></div><div className="filter-select"><Filter size={15} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas as categorias</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={14} /></div></section><section className="panel transactions-table-panel"><div className="table-toolbar"><span className="eyebrow">{filtered.length} RESULTADOS</span><strong>{total >= 0 ? "Saldo filtrado" : "Resultado filtrado"}: <span className={total >= 0 ? "text-positive" : "text-negative"}>{formatCurrency(total)}</span></strong></div>{filtered.length ? <div className="transaction-list transaction-list-wide">{filtered.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onEdit={() => onEdit(transaction)} onDelete={() => onDelete(transaction)} />)}</div> : <EmptyState onAdd={onAdd} />}</section></div>;
}

function CategoriesView({ transactions, month, onMonthChange }: { transactions: Transaction[]; month: string; onMonthChange: (month: string) => void }) {
  const expenses = transactions.filter((item) => item.type === "expense" && monthKey(item.date) === month);
  const byCategory = Array.from(new Set(expenses.map((item) => item.category))).map((category) => ({ category, value: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amountCents, 0) })).sort((a, b) => b.value - a.value);
  const total = byCategory.reduce((sum, item) => sum + item.value, 0);
  return <div className="page-content"><section className="page-heading"><div><div className="section-kicker"><span className="kicker-line" /> ORGANIZAÇÃO <span className="kicker-number">03</span></div><h1>Onde seu dinheiro vai.</h1><p>Encontre padrões sem transformar a sua vida em uma planilha interminável.</p></div><MonthSwitcher month={month} onChange={onMonthChange} /></section><section className="category-layout"><article className="panel category-summary"><div className="panel-heading"><div><span className="eyebrow">DISTRIBUIÇÃO</span><h2>Saídas por categoria</h2></div><span className="panel-index">{getMonthLabelShort(month)}</span></div>{byCategory.length ? <div className="category-bars">{byCategory.map((item, index) => { const share = total ? Math.round((item.value / total) * 100) : 0; const color = CATEGORY_COLORS[item.category] ?? "#7B8794"; return <div className="category-bar-row" key={item.category}><div className="category-bar-label"><span><i style={{ backgroundColor: color }} />{item.category}</span><strong>{formatCurrency(item.value)}</strong></div><div className="category-track"><span style={{ width: `${Math.max(share, 3)}%`, backgroundColor: color }} /></div><small>{share}% das saídas</small></div>; })}</div> : <EmptyState onAdd={() => undefined} />}</article><article className="panel category-insight"><div className="insight-number">{byCategory.length ? `${Math.round((byCategory[0].value / total) * 100)}%` : "0%"}</div><span className="eyebrow">MAIOR PARTICIPAÇÃO</span><h2>{byCategory[0]?.category ?? "Sem categoria"}</h2><p>{byCategory.length ? `Sua maior categoria representa ${formatCurrency(byCategory[0].value)} no período. Use esse número como ponto de partida para ajustar o próximo mês.` : "Registre alguns lançamentos para enxergar o seu primeiro padrão."}</p><div className="insight-rule" /><span className="insight-foot"><TrendingDown size={14} /> análise baseada em {expenses.length} saídas</span></article></section></div>;
}

function GoalsView({ goals, onAdd, onEdit, onDelete }: { goals: Goal[]; onAdd: () => void; onEdit: (goal: Goal) => void; onDelete: (goal: Goal) => void }) {
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetCents, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedCents, 0);
  return <div className="page-content"><section className="page-heading"><div><div className="section-kicker"><span className="kicker-line" /> PLANEJAMENTO <span className="kicker-number">04</span></div><h1>Metas que ganham forma.</h1><p>Pequenos aportes ficam mais claros quando você consegue ver o próximo marco.</p></div><button className="button button-primary" onClick={onAdd}><Plus size={17} /> Nova meta</button></section><section className="goals-overview"><div className="goal-overview-main"><span className="eyebrow">TOTAL GUARDADO</span><strong>{formatCurrency(totalSaved)}</strong><span>de {formatCurrency(totalTarget)} planejados</span></div><div className="goal-overview-progress"><div className="progress-track progress-track-large"><span style={{ width: `${totalTarget ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }} /></div><div><span>progresso combinado</span><strong>{totalTarget ? `${Math.round((totalSaved / totalTarget) * 100)}%` : "0%"}</strong></div></div><div className="goal-overview-mark"><Target size={20} /><span>próximo hábito</span><strong>aportar um pouco hoje</strong></div></section><section className="goals-grid">{goals.map((goal) => { const progress = Math.min(Math.round((goal.savedCents / goal.targetCents) * 100), 100); const remaining = Math.max(goal.targetCents - goal.savedCents, 0); return <article className="goal-card" key={goal.id}><div className="goal-card-top"><div className="goal-badge" style={{ color: goal.color, backgroundColor: `${goal.color}14` }}><Target size={18} /></div><div className="goal-card-actions"><button className="icon-button icon-button-quiet" aria-label={`Editar meta ${goal.name}`} onClick={() => onEdit(goal)}><Pencil size={15} /></button><button className="icon-button icon-button-quiet danger-hover" aria-label={`Excluir meta ${goal.name}`} onClick={() => onDelete(goal)}><Trash2 size={15} /></button></div></div><span className="eyebrow">META PESSOAL</span><h2>{goal.name}</h2><div className="goal-card-value"><strong>{formatCurrency(goal.savedCents)}</strong><span>/ {formatCurrency(goal.targetCents)}</span></div><div className="progress-track"><span style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div><div className="goal-card-foot"><span>{progress}% concluído</span><span>faltam {formatCurrency(remaining)}</span></div><div className="goal-deadline"><CalendarDays size={14} /> até {LONG_DATE.format(new Date(`${goal.deadline}T12:00:00`))}</div></article>; })}{goals.length === 0 && <div className="empty-state"><div className="empty-state-icon"><Target size={20} /></div><div><strong>Suas metas começam aqui</strong><p>Crie um primeiro marco para visualizar o progresso.</p></div><button className="button button-secondary" onClick={onAdd}><Plus size={16} /> Nova meta</button></div>}</section></div>;
}

function ReportsView({ transactions, onImport, onExport }: { transactions: Transaction[]; onImport: (file: File) => void; onExport: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const months = getLastMonths(6);
  const totalIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
  const totalExpense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
  const averageExpense = transactions.length ? Math.round(totalExpense / Math.max(months.length, 1)) : 0;
  return <div className="page-content"><section className="page-heading"><div><div className="section-kicker"><span className="kicker-line" /> LEITURA <span className="kicker-number">05</span></div><h1>Relatórios sem ruído.</h1><p>Exporte seus dados ou faça uma leitura rápida da evolução acumulada.</p></div><button className="button button-primary" onClick={onExport}><Download size={16} /> Exportar dados</button></section><section className="report-metrics"><article className="report-metric"><span className="eyebrow">ENTRADAS ACUMULADAS</span><strong>{formatCurrency(totalIncome)}</strong><span><ArrowDownLeft size={14} /> em {transactions.filter((item) => item.type === "income").length} registros</span></article><article className="report-metric"><span className="eyebrow">SAÍDAS ACUMULADAS</span><strong>{formatCurrency(totalExpense)}</strong><span><ArrowUpRight size={14} /> em {transactions.filter((item) => item.type === "expense").length} registros</span></article><article className="report-metric"><span className="eyebrow">MÉDIA MENSAL DE SAÍDAS</span><strong>{formatCurrency(averageExpense)}</strong><span><BarChart3 size={14} /> janela de seis meses</span></article></section><section className="report-layout"><article className="panel report-chart"><div className="panel-heading"><div><span className="eyebrow">EVOLUÇÃO</span><h2>Visão de seis meses</h2></div><span className="panel-index">BRL</span></div><CashflowChart transactions={transactions} /></article><article className="panel backup-panel"><div className="panel-heading"><div><span className="eyebrow">PORTABILIDADE</span><h2>Seus dados, sob seu comando.</h2></div><FileJson size={19} /></div><p>Faça uma cópia JSON para guardar ou mover seus registros. A importação substitui os dados atuais somente após uma validação do arquivo.</p><div className="backup-actions"><button className="button button-secondary" onClick={onExport}><Download size={16} /> Baixar JSON</button><button className="button button-ghost" onClick={() => inputRef.current?.click()}><Upload size={16} /> Importar JSON</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ""; }} /></div><div className="backup-note"><Check size={14} /> somente arquivos gerados pelo saldo são aceitos</div></article></section><section className="integrity-panel"><div className="integrity-icon"><Check size={17} /></div><div><strong>Cálculos baseados em centavos inteiros</strong><p>Os valores são convertidos para centavos antes das somas e só voltam a reais na apresentação. Isso evita distorções de ponto flutuante em saldos e percentuais.</p></div><span className="integrity-code">PRECISÃO · 01</span></section></div>;
}

export default function Home() {
  const [store, setStore] = useState<FinanceStore>(() => loadStore());
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [selectedMonth, setSelectedMonth] = useState(monthKey(todayISO()));
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; initial: Transaction | null }>({ open: false, initial: null });
  const [goalModal, setGoalModal] = useState<{ open: boolean; initial: Goal | null }>({ open: false, initial: null });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const saveTransaction = (form: TransactionForm) => {
    const cents = parseMoneyToCents(form.amount) ?? 0;
    const transaction: Transaction = { id: transactionModal.initial?.id ?? makeId("tx"), description: form.description.trim(), amountCents: cents, type: form.type, category: form.category, date: form.date, paymentMethod: form.paymentMethod, note: form.note.trim() };
    setStore((current) => ({ ...current, transactions: transactionModal.initial ? current.transactions.map((item) => item.id === transaction.id ? transaction : item) : [transaction, ...current.transactions] }));
    if (!categories.includes(form.category)) setCategories((current) => [...current, form.category]);
    setTransactionModal({ open: false, initial: null });
    toast.success(transactionModal.initial ? "Lançamento atualizado." : "Lançamento adicionado.", { description: `${transaction.description} · ${formatCurrency(transaction.amountCents)}` });
  };

  const deleteTransaction = (transaction: Transaction) => {
    if (!window.confirm(`Excluir “${transaction.description}”? Esta ação não pode ser desfeita.`)) return;
    setStore((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== transaction.id) }));
    toast.success("Lançamento excluído.");
  };

  const saveGoal = (form: GoalForm) => {
    const target = parseMoneyToCents(form.target) ?? 0;
    const saved = parseMoneyToCents(form.saved) ?? 0;
    const goal: Goal = { id: goalModal.initial?.id ?? makeId("goal"), name: form.name.trim(), targetCents: target, savedCents: saved, deadline: form.deadline, color: form.color };
    setStore((current) => ({ ...current, goals: goalModal.initial ? current.goals.map((item) => item.id === goal.id ? goal : item) : [...current.goals, goal] }));
    setGoalModal({ open: false, initial: null });
    toast.success(goalModal.initial ? "Meta atualizada." : "Meta criada.");
  };

  const deleteGoal = (goal: Goal) => {
    if (!window.confirm(`Excluir a meta “${goal.name}”?`)) return;
    setStore((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== goal.id) }));
    toast.success("Meta excluída.");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `saldo-backup-${todayISO()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado.", { description: "Seu arquivo JSON está pronto para guardar." });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as FinanceStore;
        const valid = imported?.version === 1 && Array.isArray(imported.transactions) && Array.isArray(imported.goals) && imported.transactions.every((item) => typeof item.amountCents === "number" && (item.type === "income" || item.type === "expense"));
        if (!valid) throw new Error("invalid");
        setStore(imported);
        toast.success("Backup importado.", { description: "Os dados deste dispositivo foram atualizados." });
      } catch {
        toast.error("Arquivo não reconhecido.", { description: "Escolha um JSON exportado pelo saldo." });
      }
    };
    reader.readAsText(file);
  };

  const openAddTransaction = () => setTransactionModal({ open: true, initial: null });
  const page = activeSection === "overview" ? <Overview transactions={store.transactions} month={selectedMonth} onMonthChange={setSelectedMonth} onAdd={openAddTransaction} onEdit={(transaction) => setTransactionModal({ open: true, initial: transaction })} onDelete={deleteTransaction} onNavigate={setActiveSection} goals={store.goals} /> : activeSection === "transactions" ? <TransactionsView transactions={store.transactions} month={selectedMonth} onMonthChange={setSelectedMonth} onAdd={openAddTransaction} onEdit={(transaction) => setTransactionModal({ open: true, initial: transaction })} onDelete={deleteTransaction} /> : activeSection === "categories" ? <CategoriesView transactions={store.transactions} month={selectedMonth} onMonthChange={setSelectedMonth} /> : activeSection === "goals" ? <GoalsView goals={store.goals} onAdd={() => setGoalModal({ open: true, initial: null })} onEdit={(goal) => setGoalModal({ open: true, initial: goal })} onDelete={deleteGoal} /> : <ReportsView transactions={store.transactions} onImport={importData} onExport={exportData} />;

  return <AppShell activeSection={activeSection} onSectionChange={setActiveSection}>{page}{transactionModal.open && <TransactionModal initial={transactionModal.initial} categories={categories} onClose={() => setTransactionModal({ open: false, initial: null })} onSave={saveTransaction} />}{goalModal.open && <GoalModal initial={goalModal.initial} onClose={() => setGoalModal({ open: false, initial: null })} onSave={saveGoal} />}</AppShell>;
}
