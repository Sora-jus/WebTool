export function formatJson(jsonString: string, pretty: boolean = true): string {
  try {
    const parsed = JSON.parse(jsonString)
    if (pretty) {
      return JSON.stringify(parsed, null, 2)
    } else {
      return JSON.stringify(parsed)
    }
  } catch (e: any) {
    throw new Error(`JSON格式错误: ${e.message}`)
  }
}

export function validateJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString)
    return true
  } catch (e: any) {
    return false
  }
}
