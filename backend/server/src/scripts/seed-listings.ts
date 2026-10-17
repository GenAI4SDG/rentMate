import "../load-env.js"
import {
  runSeedListings,
  SEED_LANDLORD_EMAIL,
  SEED_LANDLORD_NAME,
} from "./seed-data.js"

runSeedListings()
  .then((userId) => {
    console.log("Seed complete.")
    console.log(`Landlord: ${SEED_LANDLORD_NAME} (${SEED_LANDLORD_EMAIL})`)
    console.log("Optional — add to Figma/.env.local (UUID only, not service_role):")
    console.log(`VITE_DEMO_LANDLORD_ID=${userId}`)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
