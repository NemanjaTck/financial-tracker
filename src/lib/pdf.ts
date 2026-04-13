import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

// ─── Client Report ────────────────────────────────────────────────────────────

export type ClientReportInput = {
  clientName: string;
  clientPib: string | null;
  month: string;
  entries: {
    date: string;
    employee: string;
    location: string;
    hours: number;
    rate: number;
    total: number;
  }[];
  totalHours: number;
  totalCost: number;
  totalVisits: number;
  displayMode?: "default" | "by-location" | "anonymous";
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
    location?: string;
  };
};

export function generateClientReportPDF(data: ClientReportInput) {
  const doc = new jsPDF();
  const mode = data.displayMode ?? "default";

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
  doc.text(
    `${data.labels.period}: ${periodStr}`,
    14,
    data.clientPib ? 46 : 40
  );

  const startY = data.clientPib ? 52 : 46;

  if (mode === "by-location") {
    // Group entries by location
    const byLocation = new Map<
      string,
      typeof data.entries
    >();
    for (const e of data.entries) {
      const key = e.location || "—";
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key)!.push(e);
    }

    let y = startY;
    for (const [location, entries] of byLocation) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(location, 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [
          [
            data.labels.date,
            data.labels.employee,
            data.labels.hours,
            `${data.labels.total} (RSD)`,
          ],
        ],
        body: entries.map((e) => [
          e.date,
          e.employee,
          String(e.hours),
          formatRSD(e.total),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });
      y =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 8;
    }
  } else if (mode === "anonymous") {
    // Replace employee names with numbered workers
    const employeeMap = new Map<string, string>();
    let counter = 1;
    const anonymized = data.entries.map((e) => {
      if (!employeeMap.has(e.employee)) {
        employeeMap.set(e.employee, `Radnik ${counter++}`);
      }
      return { ...e, employee: employeeMap.get(e.employee)! };
    });

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
      body: anonymized.map((e) => [
        e.date,
        e.employee,
        String(e.hours),
        formatRSD(e.rate),
        formatRSD(e.total),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
  } else {
    // Default: by employee (original behavior)
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
  }

  // Summary
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.labels.visits}: ${data.totalVisits}`, 14, finalY + 10);
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

// ─── Accountant Report ────────────────────────────────────────────────────────

export type AccountantReportInput = {
  month: string;
  revenue: {
    name: string;
    pib: string | null;
    hours: number;
    amount: number;
    dailyRate: number | null;
    days: number | null;
    locations?: { name: string; days: number }[];
  }[];
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
    netProfit: string;
    name: string;
    amount: string;
    total: string;
    pib: string;
    hours: string;
    price: string;
    days: string;
    dailyRate: string;
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

  // Revenue section - clients with PIB, hours, price
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(data.labels.revenue, 14, y);
  y += 2;

  // Build table rows
  const revenueBody: string[][] = [];
  for (const r of data.revenue) {
    if (r.dailyRate && r.locations && r.locations.length > 0) {
      // Daily rate mode: show each location with days × daily rate
      for (const loc of r.locations) {
        revenueBody.push([
          `${r.name} - ${loc.name}`,
          r.pib ?? "",
          `${loc.days} ${data.labels.days}`,
          formatRSD(r.dailyRate),
          formatRSD(loc.days * r.dailyRate),
        ]);
      }
    } else {
      // Standard mode: hours × hourly rate
      revenueBody.push([
        r.name,
        r.pib ?? "",
        String(r.hours),
        formatRSD(r.hours > 0 ? r.amount / r.hours : 0),
        formatRSD(r.amount),
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [
      [
        data.labels.name,
        data.labels.pib,
        data.labels.hours,
        data.labels.price,
        `${data.labels.total} (RSD)`,
      ],
    ],
    body: revenueBody,
    foot: [["", "", "", data.labels.total, formatRSD(data.totals.revenue)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [39, 174, 96] },
    footStyles: {
      fillColor: [39, 174, 96],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;

  // Net profit
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.labels.netProfit}: ${formatRSD(data.totals.profit)} RSD`,
    14,
    y
  );

  doc.save(`accountant_report_${data.month.substring(0, 7)}.pdf`);
}
