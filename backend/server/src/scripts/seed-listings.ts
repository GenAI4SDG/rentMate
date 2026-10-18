import "../load-env.js"
import {
  runSeedListings,
  SEED_LANDLORD_EMAIL,
  SEED_LANDLORD_NAME,
} from "./seed-data.js"

runSeedListings()
  .then(() => {
    console.log("Seed complete.")
    console.log(`Demo owner: ${SEED_LANDLORD_NAME} (${SEED_LANDLORD_EMAIL})`)
    console.log(
      `Password: ${process.env.SEED_LANDLORD_PASSWORD ?? "rentmate-testing-demo"}`,
    )
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
