from typing import Tuple

class PriceAnalyzer:
    @staticmethod
    def judge(paid: float, stat: float) -> Tuple[float, float, str]:
        diff = paid - stat
        rate = diff / stat if stat != 0 else 0.0
        if rate <= -0.05:
            j = "DEAL"
        elif rate >= 0.05:
            j = "OVERPAY"
        else:
            j = "FAIR"
        return diff, rate, j
