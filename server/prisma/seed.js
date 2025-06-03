// prisma/seed.js

/**
 * prisma/seed.js
 *
 * Upsert a set of “high-level” roles into the database.
 * Then create a few dummy users — each assigned the “Member” role.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// All permissions
const ALL_PERMISSIONS = [
  'view_own_profile',
  'edit_own_profile',
  'manage_events',
  'create_event',
  'update_event',
  'delete_event',
  'manage_philanthropy',
  'view_reports',
  'manage_finances',
  'approve_budgets',
  'manage_duties',
  'assign_high_roles',
  'manage_users',
  'assign_duties',
  'export_financial_reports',
  'manage_roles',
  'manage_folders',
  'manage_documents',
  'manage_operations',
  'view_philanthropy_reports',
  'manage_csr_logs',
  'view_all_data',
  'export_data',
  'manage_data_integrity',
  'view_financials',
  'manage_budget',
  'view_risk_reports',
  'manage_risk_assessments',
  'manage_external_relations',
  'view_external_reports',
  'manage_training',
  'view_training_reports',
  'manage_sales_pipeline',
  'view_sales_metrics',
  'manage_talent_development',
  'view_talent_reports',
  'view_career_data',
  'manage_career_sessions',
  'view_alumni_data',
  'advise_members',
  'manage_household',
  'view_house_reports',
  'manage_sports_teams',
  'view_sports_schedule',
  'manage_system_settings',
];

async function main() {
  // 1) Upsert all roles with simplified displayName
  const rolesToUpsert = [
    {
      name: 'Member',
      displayName: 'Member',
      permissions: ['view_own_profile', 'edit_own_profile'],
    },
    {
      name: 'High Alpha',
      displayName: 'High Alpha',
      // Include assign_roles so this role can assign others
      permissions: [...ALL_PERMISSIONS, 'assign_roles'],
    },
    {
      name: 'High Beta',
      displayName: 'High Beta',
      permissions: ['manage_operations', 'manage_duties'],
    },
    {
      name: 'High Theta',
      displayName: 'High Theta',
      permissions: ['view_philanthropy_reports', 'manage_csr_logs'],
    },
    {
      name: 'High Gamma',
      displayName: 'High Gamma',
      permissions: ['view_all_data', 'export_data', 'manage_data_integrity'],
    },
    {
      name: 'High Tau',
      displayName: 'High Tau',
      permissions: ['view_financials', 'manage_budget'],
    },
    {
      name: 'High Iota',
      displayName: 'High Iota',
      permissions: ['view_risk_reports', 'manage_risk_assessments'],
    },
    {
      name: 'High Rho',
      displayName: 'High Rho',
      permissions: ['manage_external_relations', 'view_external_reports'],
    },
    {
      name: 'High Kappa',
      displayName: 'High Kappa',
      permissions: ['manage_training', 'view_training_reports'],
    },
    {
      name: 'High Delta',
      displayName: 'High Delta',
      permissions: ['manage_sales_pipeline', 'view_sales_metrics'],
    },
    {
      name: 'High Phi',
      displayName: 'High Phi',
      permissions: ['manage_talent_development', 'view_talent_reports'],
    },
    {
      name: 'High Sigma',
      displayName: 'High Sigma',
      permissions: ['view_career_data', 'manage_career_sessions'],
    },
    {
      name: 'High Epsilon',
      displayName: 'High Epsilon',
      permissions: ['manage_events', 'view_reports'],
    },
    {
      name: 'High Pi',
      displayName: 'High Pi',
      permissions: ['view_alumni_data', 'advise_members'],
    },
    {
      name: 'House Manager',
      displayName: 'House Manager',
      permissions: ['manage_household', 'view_house_reports'],
    },
    {
      name: 'High Jock',
      displayName: 'High Jock',
      permissions: ['manage_sports_teams', 'view_sports_schedule'],
    },
    {
      name: 'High Nerd',
      displayName: 'High Nerd',
      // Include assign_roles so this role can assign others
      permissions: [...ALL_PERMISSIONS, 'assign_roles'],
    },
  ];

  for (const roleData of rolesToUpsert) {
    const { name, displayName, permissions } = roleData;
    await prisma.role.upsert({
      where: { name },
      update: { displayName, permissions },
      create: { name, displayName, permissions },
    });
    console.log(`Upserted role: ${name}`);
  }

  // 2) Create dummy “Member” accounts (each will have exactly one role: “Member”)
  const dummyMembers = [
    { email: 'member1@example.com', name: 'Member One' },
    { email: 'member2@example.com', name: 'Member Two' },
    { email: 'member3@example.com', name: 'Member Three' },
    { email: 'member4@example.com', name: 'Member Four' },
    { email: 'member5@example.com', name: 'Member Five' },
  ];

  for (const { email, name } of dummyMembers) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      console.log(`User already exists: ${normalizedEmail}`);
      continue;
    }

    const passwordHash = bcrypt.hashSync('password123', 10);

    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        emailConfirmed: true, // mark them as confirmed
        emailConfirmCode: null,
        resetToken: null,
        resetTokenExpiry: null,
        userRoles: {
          create: {
            role: {
              connect: { name: 'Member' },
            },
          },
        },
      },
    });

    console.log(`Created dummy member: ${normalizedEmail}`);
  }

  console.log('Dummy members seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
