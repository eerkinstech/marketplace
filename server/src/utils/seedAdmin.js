import { connectDatabase } from "../config/db.js";
import { User } from "../models/User.js";

const seed = async () => {
  await connectDatabase();

  const exists = await User.findOne({ email: "admin@marketplace.local" }).select("+password");
  if (exists) {
    exists.name = "Platform Admin";
    exists.password = "Admin@12345";
    exists.role = "admin";
    exists.status = "active";
    await exists.save();
    console.log("Admin already exists and credentials were refreshed");
    process.exit(0);
  }

  await User.create({
    name: "Platform Admin",
    email: "admin@marketplace.local",
    password: "Admin@12345",
    role: "admin",
    status: "active"
  });

  console.log("Admin seeded: admin@marketplace.local / Admin@12345");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
