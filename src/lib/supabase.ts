// Temporary local storage implementation to replace Supabase
export const supabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => {
      const data = localStorage.getItem(table);
      const items = data ? JSON.parse(data) : [];
      
      return {
        data: items,
        error: null,
        eq: (field: string, value: any) => {
          const filtered = items.filter((item: any) => item[field] === value);
          return {
            data: filtered,
            error: null,
            single: () => ({
              data: filtered.length > 0 ? filtered[0] : null,
              error: null
            })
          };
        }
      };
    },
    insert: async (data: any) => {
      const existing = localStorage.getItem(table);
      const items = existing ? JSON.parse(existing) : [];
      const newItem = {
        id: crypto.randomUUID(),
        ...data
      };
      items.push(newItem);
      localStorage.setItem(table, JSON.stringify(items));
      return { data: newItem, error: null };
    },
    update: async (data: any) => {
      localStorage.setItem(table, JSON.stringify(data));
      return { data, error: null };
    }
  })
};