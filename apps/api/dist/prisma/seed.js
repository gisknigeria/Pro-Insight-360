"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_neon_1 = require("@prisma/adapter-neon");
const serverless_1 = require("@neondatabase/serverless");
const ws_1 = __importDefault(require("ws"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
const pool = new serverless_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_neon_1.PrismaNeon(pool);
const prisma = new client_1.PrismaClient({ adapter });
const DIGITAL_READINESS_CATEGORIES = [
    'Leadership & Strategy',
    'IT Infrastructure',
    'Cybersecurity',
    'Data Management',
    'Digital Skills',
    'Process Automation',
    'Customer Experience',
    'Innovation Culture',
    'Connectivity',
    'Software Adoption',
    'Change Management',
    'Budget & Investment',
    'Compliance & Governance',
    'Collaboration Tools',
];
async function main() {
    const superAdminId = process.env.SEED_SUPER_ADMIN_ID;
    if (!superAdminId) {
        throw new Error('SEED_SUPER_ADMIN_ID environment variable is required.\n' +
            'Create a Super Admin user first, then run:\n' +
            '  SEED_SUPER_ADMIN_ID=<uuid> npx ts-node prisma/seed.ts');
    }
    const admin = await prisma.user.findUnique({ where: { id: superAdminId } });
    if (!admin) {
        throw new Error(`No user found with ID: ${superAdminId}`);
    }
    console.log(`Seeding scoring weights for Super Admin: ${admin.email}`);
    const equalWeight = parseFloat((1 / DIGITAL_READINESS_CATEGORIES.length).toFixed(4));
    for (const category of DIGITAL_READINESS_CATEGORIES) {
        await prisma.scoringWeight.upsert({
            where: { category },
            update: { weight: equalWeight, updatedById: superAdminId },
            create: { category, weight: equalWeight, updatedById: superAdminId },
        });
        console.log(`  ✓ ${category}: ${equalWeight}`);
    }
    console.log('\nSeed complete. 14 scoring weights created with equal weights.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map