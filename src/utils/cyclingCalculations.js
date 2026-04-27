export function calculateVam(elevationMeters, timeInHours) {
  return elevationMeters / timeInHours;
}

export function calculateMetersPerKm(elevationMeters, distanceKm) {
  return elevationMeters / distanceKm;
}

export function calculateAverageSpeed(distanceKm, timeInHours) {
  return distanceKm / timeInHours;
}

export function calculateEstimatedTime(distanceKm, averageSpeedKmH) {
  return distanceKm / averageSpeedKmH;
}

export function classifyRouteByMetersPerKm(metersPerKm) {
  if (metersPerKm <= 10) {
    return {
      key: "leve",
      label: "Leve / plano",
    };
  }

  if (metersPerKm <= 20) {
    return {
      key: "moderado",
      label: "Moderado",
    };
  }

  if (metersPerKm <= 30) {
    return {
      key: "dificil",
      label: "Dificil",
    };
  }

  if (metersPerKm <= 40) {
    return {
      key: "muito-dificil",
      label: "Muito dificil",
    };
  }

  return {
    key: "extremo",
    label: "Extremo / montanha",
  };
}

export function classifyVam(vam) {
  if (vam <= 300) {
    return {
      key: "iniciante",
      label: "Leve / iniciante",
    };
  }

  if (vam <= 600) {
    return {
      key: "moderado",
      label: "Moderado",
    };
  }

  if (vam <= 900) {
    return {
      key: "forte",
      label: "Forte",
    };
  }

  return {
    key: "muito-forte",
    label: "Muito forte / performance alta",
  };
}

export function convertDurationToHours(hours = 0, minutes = 0) {
  return hours + minutes / 60;
}

export function formatDurationFromHours(timeInHours) {
  const totalMinutes = Math.round(timeInHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${String(minutes).padStart(2, "0")}`;
}
