// One-off: creates the first admin. Later users are invited by an admin.
// Usage: pnpm --filter stok create-admin <email> "<Ad Soyad>"   (asks for the password)
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { userRole } from "../db/schema";
import { createUser, type NewUser } from "../lib/users";

export async function createFirstAdmin(admin: Pick<NewUser, "email" | "name" | "password">) {
  const existing = await db.query.userRole.findFirst({ where: eq(userRole.role, "admin") });
  if (existing) throw new Error("Sistemde zaten bir yönetici var; yeni kullanıcıları o davet etmeli.");
  return createUser({ ...admin, roles: ["admin"] });
}

// Reads a line without echoing it, so the password doesn't stay in the terminal.
async function askHidden(question: string) {
  process.stdout.write(question);
  const silent = new Writable({ write: (_chunk, _encoding, done) => done() });
  const prompt = createInterface({ input: process.stdin, output: silent, terminal: true });
  const answer = await prompt.question("");
  prompt.close();
  process.stdout.write("\n");
  return answer;
}

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !name) {
    console.error('Kullanım: pnpm --filter stok create-admin <e-posta> "<Ad Soyad>"');
    process.exit(1);
  }
  const password = await askHidden("Şifre: ");

  const admin = await createFirstAdmin({ email, name, password });
  console.log(`Yönetici oluşturuldu: ${admin.email}`);
  await db.$client.end();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$client.end();
    process.exit(1);
  });
}
