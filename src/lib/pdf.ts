import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export type ClientReportInput = {
  clientName: string;
  clientPib: string | null;
  month: string;
  entries: {
    date: string;
    employee: string;
    hours: number;
    rate: number;
    total: number;
  }[];
  totalHours: number;
  totalCost: number;
  totalVisits: number;
  labels: {
    clientReport: string;
    period: string;
    date: string;
    employee: string;
    hours: string;
    hourlyRate: string;
    total: string;
    totalHours: string;
    totalCost: string;
    visits: string;
  };
};

export function generateClientReportPDF(data: ClientReportInput) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(data.labels.clientReport, 14, 20);

  // Client info
  doc.setFontSize(12);
  doc.text(data.clientName, 14, 32);
  if (data.clientPib) {
    doc.setFontSize(10);
    doc.text(`PIB: ${data.clientPib}`, 14, 38);
  }

  // Period
  const monthDate = new Date(data.month + "T00:00:00");
  const periodStr = monthDate.toLocaleDateString("sr-Latn-RS", {
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`${data.labels.period}: ${periodStr}`, 14, data.clientPib ? 46 : 40);

  // Table
  const startY = data.clientPib ? 52 : 46;
  autoTable(doc, {
    startY,
    head: [
      [
        data.labels.date,
        data.labels.employee,
        data.labels.hours,
        `${data.labels.hourlyRate} (RSD)`,
        `${data.labels.total} (RSD)`,
      ],
    ],
    body: data.entries.map((e) => [
      e.date,
      e.employee,
      String(e.hours),
      formatRSD(e.rate),
      formatRSD(e.total),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Summary
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.text(
    `${data.labels.visits}: ${data.totalVisits}`,
    14,
    finalY + 10
  );
  doc.text(
    `${data.labels.totalHours}: ${data.totalHours}`,
    14,
    finalY + 16
  );
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.labels.totalCost}: ${formatRSD(data.totalCost)} RSD`,
    14,
    finalY + 24
  );

  doc.save(
    `${data.clientName.replace(/\s+/g, "_")}_${data.month.substring(0, 7)}.pdf`
  );
}

export type AccountantReportInput = {
  month: string;
  revenue: { name: string; amount: number }[];
  salaries: { name: string; amount: number }[];
  fixedCosts: { name: string; amount: number }[];
  variableCosts: { name: string; amount: number; date: string }[];
  totals: {
    revenue: number;
    salaries: number;
    fixedCosts: number;
    variableCosts: number;
    profit: number;
  };
  labels: {
    accountantReport: string;
    period: string;
    revenue: string;
    salaries: string;
    fixedCosts: string;
    variableCosts: string;
    netProfit: string;
    name: string;
    amount: string;
    total: string;
    date: string;
  };
};

export function generateAccountantReportPDF(data: AccountantReportInput) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(data.labels.accountantReport, 14, 20);

  // Period
  const monthDate = new Date(data.month + "T00:00:00");
  const periodStr = monthDate.toLocaleDateString("sr-Latn-RS", {
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`${data.labels.period}: ${periodStr}`, 14, 30);

  let y = 38;

  // Revenue section
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(data.labels.revenue, 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [[data.labels.name, `${data.labels.amount} (RSD)`]],
    body: data.revenue.map((r) => [r.name, formatRSD(r.amount)]),
    foot: [[data.labels.total, formatRSD(data.totals.revenue)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [39, 174, 96] },
    footStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: "bold" },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

  // Salaries section
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(data.labels.salaries, 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [[data.labels.name, `${data.labels.amount} (RSD)`]],
    body: data.salaries.map((s) => [s.name, formatRSD(s.amount)]),
    foot: [[data.labels.total, formatRSD(data.totals.salaries)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [231, 76, 60] },
    footStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: "bold" },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;

  // Fixed costs section
  if (data.fixedCosts.length > 0) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(data.labels.fixedCosts, 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [[data.labels.name, `${data.labels.amount} (RSD)`]],
      body: data.fixedCosts.map((fc) => [fc.name, formatRSD(fc.amount)]),
      foot: [[data.labels.total, formatRSD(data.totals.fixedCosts)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [243, 156, 18] },
      footStyles: {
        fillColor: [243, 156, 18],
        textColor: 255,
        fontStyle: "bold",
      },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
  }

  // Variable costs section
  if (data.variableCosts.length > 0) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(data.labels.variableCosts, 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [
        [data.labels.name, data.labels.date, `${data.labels.amount} (RSD)`],
      ],
      body: data.variableCosts.map((vc) => [
        vc.name,
        vc.date,
        formatRSD(vc.amount),
      ]),
      foot: [["", data.labels.total, formatRSD(data.totals.variableCosts)]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [155, 89, 182] },
      footStyles: {
        fillColor: [155, 89, 182],
        textColor: 255,
        fontStyle: "bold",
      },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
  }

  // Net profit
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const profitText = `${data.labels.netProfit}: ${formatRSD(data.totals.profit)} RSD`;
  doc.text(profitText, 14, y + 4);

  doc.save(`accountant_report_${data.month.substring(0, 7)}.pdf`);
}
