from intelligence.optimization.scheduler import optimize_block_plan


def get_today_plan():
    """
    Generate the optimized maintenance block for today.
    """

    return optimize_block_plan(
        planning_period="Today"
    )


def get_week_plan():
    """
    Generate the prototype weekly planning result.

    The current optimizer operates on the representative
    planning dataset and returns the optimized block.
    """

    return optimize_block_plan(
        planning_period="This Week"
    )


def get_month_plan():
    """
    Generate the prototype monthly planning result.

    The current optimizer operates on the representative
    planning dataset and returns the optimized block.
    """

    return optimize_block_plan(
        planning_period="This Month"
    )