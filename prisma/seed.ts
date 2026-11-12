import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 12);

  // ─── Personnel (Users) ───
  const staff = [
    { name: "Admin Général", email: "admin@hopital.mg", role: "ADMIN" as const, department: "Direction" },
    { name: "Dr. Andrianina Rakoto", email: "doctor@hopital.mg", role: "DOCTOR" as const, department: "Cardiologie" },
    { name: "Dr. Fara Rasoanaivo", email: "fara.doctor@hopital.mg", role: "DOCTOR" as const, department: "Pédiatrie" },
    { name: "Dr. Jean Randriamampionona", email: "jean.doctor@hopital.mg", role: "DOCTOR" as const, department: "Chirurgie" },
    { name: "Inf. Rasoa Razafindrakoto", email: "nurse@hopital.mg", role: "NURSE" as const, department: "Médecine" },
    { name: "Inf. Mamy Andriamanana", email: "mamy.nurse@hopital.mg", role: "NURSE" as const, department: "Urgences" },
    { name: "Inf. Lalao Ravelomanana", email: "lalao.nurse@hopital.mg", role: "NURSE" as const, department: "Maternité" },
    { name: "Accueil Principal", email: "reception@hopital.mg", role: "RECEPTIONIST" as const, department: "Accueil" },
    { name: "Voahangy Rasoanirina", email: "voahangy.accueil@hopital.mg", role: "RECEPTIONIST" as const, department: "Accueil" },
    { name: "Hery Andriamampianina", email: "hery.admin@hopital.mg", role: "ADMIN" as const, department: "Administration" },
    { name: "Dr. Hasina Rakotonirina", email: "hasina.doctor@hopital.mg", role: "DOCTOR" as const, department: "Médecine interne" },
    { name: "Dr. Tsiry Andrianaivo", email: "tsiry.doctor@hopital.mg", role: "DOCTOR" as const, department: "Urgences" },
    { name: "Inf. Zo Rakotondrabe", email: "zo.nurse@hopital.mg", role: "NURSE" as const, department: "Chirurgie" },
    { name: "Inf. Bako Rabary", email: "bako.nurse@hopital.mg", role: "NURSE" as const, department: "Pédiatrie" },
  ];

  for (const s of staff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, role: s.role, department: s.department },
      create: { ...s, password },
    });
  }

  // ─── Services ───
  const services = [
    { name: "Pédiatrie", description: "Soins des nourrissons, enfants et adolescents" },
    { name: "Cardiologie", description: "Maladies du cœur et des vaisseaux" },
    { name: "Chirurgie", description: "Interventions chirurgicales et suivi post-opératoire" },
    { name: "Maternité", description: "Obstétrique, accouchements et suites de couches" },
    { name: "Médecine interne", description: "Pathologies médicales de l'adulte" },
    { name: "Urgences", description: "Prise en charge immédiate des urgences" },
  ];

  const serviceIds: Record<string, string> = {};
  for (const sv of services) {
    const row = await prisma.service.upsert({
      where: { name: sv.name },
      update: { description: sv.description },
      create: sv,
    });
    serviceIds[sv.name] = row.id;
  }

  // ─── Chambres + Lits ───
  // Les chambres STANDARD sont réparties entre les services.
  // VIP et ICU n'appartiennent à aucun service (service: null).
  const rooms: {
    number: string;
    floor: number;
    type: "STANDARD" | "VIP" | "ICU";
    beds: number;
    service: string | null;
  }[] = [
    { number: "101", floor: 1, type: "STANDARD", beds: 4, service: "Pédiatrie" },
    { number: "102", floor: 1, type: "STANDARD", beds: 4, service: "Pédiatrie" },
    { number: "103", floor: 1, type: "STANDARD", beds: 2, service: "Cardiologie" },
    { number: "104", floor: 1, type: "STANDARD", beds: 2, service: "Cardiologie" },
    { number: "105", floor: 1, type: "STANDARD", beds: 4, service: "Chirurgie" },
    { number: "106", floor: 1, type: "STANDARD", beds: 2, service: "Chirurgie" },
    { number: "107", floor: 1, type: "STANDARD", beds: 3, service: "Maternité" },
    { number: "108", floor: 1, type: "STANDARD", beds: 3, service: "Maternité" },
    { number: "109", floor: 1, type: "STANDARD", beds: 4, service: "Médecine interne" },
    { number: "110", floor: 1, type: "STANDARD", beds: 4, service: "Urgences" },
    { number: "201", floor: 2, type: "VIP", beds: 1, service: null },
    { number: "202", floor: 2, type: "VIP", beds: 1, service: null },
    { number: "301", floor: 3, type: "ICU", beds: 2, service: null },
    { number: "302", floor: 3, type: "ICU", beds: 2, service: null },
  ];

  for (const r of rooms) {
    const serviceId = r.type === "STANDARD" && r.service ? serviceIds[r.service] : null;
    await prisma.chambre.upsert({
      where: { number: r.number },
      // update : réassigne le service si la chambre existait déjà (seed relançable)
      update: { serviceId, type: r.type, floor: r.floor },
      create: {
        number: r.number,
        floor: r.floor,
        type: r.type,
        serviceId,
        lits: {
          create: Array.from({ length: r.beds }, (_, i) => ({
            bedNumber: `${r.number}-${i + 1}`,
          })),
        },
      },
    });
  }

  // ─── Patients ohatra ───
  // On repart de zéro : patients supprimés, lits libérés (AVANT de choisir les lits à occuper,
  // sinon un second `db:seed` ne trouverait plus de lits libres).
  await prisma.patient.deleteMany();
  await prisma.lit.updateMany({ data: { status: "AVAILABLE" } });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysAgo = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

  type Status = "ADMITTED" | "DISCHARGED" | "OUTPATIENT";
  type Gender = "MALE" | "FEMALE";
  // [prénom, nom, naissance, sexe, statut, antécédents, entrée (jours avant aujourd'hui), durée du séjour (sortis)]
  const rows: [string, string, string, Gender, Status, string | null, number, number][] = [
    // Hospitalisés (14)
    ["Rivo", "Andrianasolo", "1985-03-12", "MALE", "ADMITTED", "Hypertension artérielle, diabète type 2", 2, 0],
    ["Mialy", "Rasoamanana", "1992-07-28", "FEMALE", "ADMITTED", "Asthme chronique", 1, 0],
    ["Tojo", "Rakotomavo", "1978-11-05", "MALE", "ADMITTED", "Antécédent d'infarctus 2020", 5, 0],
    ["Hanta", "Rakotoarisoa", "1990-02-14", "FEMALE", "ADMITTED", "Grossesse à terme", 0, 0],
    ["Lanto", "Randrianarisoa", "2015-05-09", "MALE", "ADMITTED", "Bronchiolite", 3, 0],
    ["Soa", "Ravelojaona", "2018-09-30", "FEMALE", "ADMITTED", "Gastro-entérite aiguë", 2, 0],
    ["Faniry", "Andrianjafy", "1969-12-01", "MALE", "ADMITTED", "Insuffisance cardiaque", 6, 0],
    ["Noro", "Rabemananjara", "1988-06-17", "FEMALE", "ADMITTED", null, 1, 0],
    ["Heritiana", "Rakotozafy", "1975-04-22", "MALE", "ADMITTED", "Appendicectomie programmée", 4, 0],
    ["Volatiana", "Razanakolona", "1995-10-03", "FEMALE", "ADMITTED", "Césarienne", 2, 0],
    ["Andry", "Ratsimbazafy", "1958-08-19", "MALE", "ADMITTED", "BPCO, tabagisme", 7, 0],
    ["Liva", "Rasolofoniaina", "2012-01-26", "FEMALE", "ADMITTED", "Paludisme simple", 1, 0],
    ["Mamitiana", "Ramanantsoa", "1982-03-30", "MALE", "ADMITTED", "Fracture du tibia", 3, 0],
    ["Sahondra", "Rakotonindrina", "1971-07-07", "FEMALE", "ADMITTED", "Hypertension artérielle", 5, 0],
    // Sortis (6) : entrée = sortie - durée
    ["Nirina", "Andriamahazo", "1965-09-15", "MALE", "DISCHARGED", "Insuffisance rénale chronique", 12, 7],
    ["Ony", "Rajaonarison", "1999-05-11", "FEMALE", "DISCHARGED", "Pneumonie", 15, 6],
    ["Fidy", "Randrianasolo", "1980-11-23", "MALE", "DISCHARGED", "Fracture du poignet", 20, 4],
    ["Tiana", "Rakotovao", "2010-02-02", "FEMALE", "DISCHARGED", "Appendicite opérée", 10, 5],
    ["Jean", "Rabenandrasana", "1952-06-14", "MALE", "DISCHARGED", "Diabète type 2", 25, 9],
    ["Aina", "Razafindralambo", "1993-12-29", "FEMALE", "DISCHARGED", "Accouchement", 9, 3],
    // Externes (6)
    ["Fara", "Razafimahatratra", "2001-01-20", "FEMALE", "OUTPATIENT", null, 0, 0],
    ["Koloina", "Andrianarivo", "1987-09-09", "FEMALE", "OUTPATIENT", "Migraine", 0, 0],
    ["Mickaël", "Rakotoson", "1994-04-04", "MALE", "OUTPATIENT", null, 0, 0],
    ["Prisca", "Ravaoarisoa", "1976-02-18", "FEMALE", "OUTPATIENT", "Hypothyroïdie", 0, 0],
    ["Dina", "Randriamiarana", "2005-08-08", "MALE", "OUTPATIENT", null, 0, 0],
    ["Zanah", "Rasoanirina", "1963-10-10", "FEMALE", "OUTPATIENT", "Arthrose", 0, 0],
  ];

  // Lits à occuper : un lit sur deux, pour répartir les patients entre les services.
  const allBeds = await prisma.lit.findMany({ orderBy: [{ chambre: { number: "asc" } }, { bedNumber: "asc" }] });
  const beds = allBeds.filter((_, i) => i % 2 === 0);
  let nextBed = 0;

  for (let i = 0; i < rows.length; i++) {
    const [firstName, lastName, dob, gender, status, medicalHistory, entryDaysAgo, stay] = rows[i];

    let litId: string | null = null;
    let admittedAt: Date | null = null;
    let dischargedAt: Date | null = null;

    if (status === "ADMITTED") {
      const bed = beds[nextBed++];
      if (!bed) throw new Error("Pas assez de lits pour le seed");
      litId = bed.id;
      admittedAt = daysAgo(entryDaysAgo);
      await prisma.lit.update({ where: { id: bed.id }, data: { status: "OCCUPIED" } });
    } else if (status === "DISCHARGED") {
      admittedAt = daysAgo(entryDaysAgo);
      dischargedAt = daysAgo(entryDaysAgo - stay);
    }

    await prisma.patient.create({
      data: {
        firstName,
        lastName,
        dob: new Date(dob),
        gender,
        phone: `+261 3${i % 5} ${String(10 + i).padStart(2, "0")} ${String(20 + i).padStart(2, "0")} ${String(30 + i).padStart(2, "0")}`,
        emergencyContact: status === "OUTPATIENT" ? null : `Proche de ${firstName}, 03${i % 5} 44 55 ${String(10 + i).padStart(2, "0")}`,
        medicalHistory,
        status,
        admittedAt,
        dischargedAt,
        litId,
      },
    });
  }
  const samplePatients = rows;

  console.log("✅ Seed terminé :");
  console.log(`   - ${staff.length} personnel`);
  console.log(`   - ${services.length} services`);
  console.log(`   - ${rooms.length} chambres (${rooms.filter((r) => r.service).length} réparties en services, VIP/ICU hors service)`);
  console.log(`   - ${samplePatients.length} patients d'exemple`);
  console.log("   Mot de passe par défaut : password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
