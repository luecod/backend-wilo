import bcrypt from "bcrypt";

const encriptyngPassword = async (pin) => {
  try {
    const hash = await bcrypt.hash(pin, 10);
    return hash;
  } catch (error) {
    throw error;
  }
};

const comparePassword = async (pin, hash) => {
  try {
    const result = await bcrypt.compare(pin, hash);
    return result;
  } catch (error) {
    throw error;
  }
};
export { encriptyngPassword, comparePassword };
