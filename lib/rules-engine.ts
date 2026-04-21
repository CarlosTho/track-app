const SUGAR_KEYWORDS = [
  'soda', 'pop', 'cola', 'sprite', 'candy', 'cake', 'cookie', 'donut',
  'brownie', 'ice cream', 'icecream', 'chocolate', 'syrup', 'sugar',
  'sweetened', 'juice', 'lemonade', 'energy drink', 'gatorade', 'sweetener',
  'honey', 'agave', 'muffin', 'pastry', 'danish', 'cinnamon roll',
]

const SALT_KEYWORDS = [
  'chips', 'pretzels', 'pretzel', 'popcorn', 'crackers', 'jerky',
  'ramen', 'instant noodles', 'fast food', 'fries', 'french fries',
  'processed', 'canned soup', 'pickles', 'salted', 'soy sauce', 'hot sauce',
  'ketchup', 'mustard', 'ranch', 'dressing', 'frozen meal', 'pizza',
]

export interface ComplianceSuggestion {
  isCompliant: boolean
  flags: string[]
}

export function suggestCompliance(
  description: string,
  rules: { noAddedSugar: boolean; noAddedSalt: boolean }
): ComplianceSuggestion {
  const lower = description.toLowerCase()
  const flags: string[] = []

  if (rules.noAddedSugar) {
    for (const keyword of SUGAR_KEYWORDS) {
      if (lower.includes(keyword)) {
        flags.push(`Contains "${keyword}" (added sugar rule)`)
        break
      }
    }
  }

  if (rules.noAddedSalt) {
    for (const keyword of SALT_KEYWORDS) {
      if (lower.includes(keyword)) {
        flags.push(`Contains "${keyword}" (added salt rule)`)
        break
      }
    }
  }

  return {
    isCompliant: flags.length === 0,
    flags,
  }
}
