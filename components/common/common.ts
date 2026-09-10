// Helper function to ensure we always work with valid Date objects
export const ensureValidDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date && !isNaN(date.getTime())) return date;
    try {
        const newDate = new Date(date);
        return isNaN(newDate.getTime()) ? new Date() : newDate;
    } catch (e) {
        return new Date();
    }
};