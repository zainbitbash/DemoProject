let loopcheck = true;

export async function stopLoop() {
  loopcheck = false;
  return;
}

export async function startLoop() {
  loopcheck = true;
  return;
}

export async function check() {
  return loopcheck;
}
